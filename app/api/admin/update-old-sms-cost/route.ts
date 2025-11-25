import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { authenticateRequest } from '@/lib/middleware/auth';

/**
 * POST /api/admin/update-old-sms-cost
 * Updates cost information for old bulk SMS sends
 * 
 * Body: {
 *   dateString: "25.11.2025 03:04:38", // DD.MM.YYYY HH:mm:ss format
 *   expectedCount?: number, // Expected number of messages (e.g., 998)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admin can update old SMS costs
    if (auth.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { dateString, expectedCount } = body;

    if (!dateString) {
      return NextResponse.json(
        { success: false, message: 'dateString is required' },
        { status: 400 }
      );
    }

    // Parse the date string (DD.MM.YYYY HH:mm:ss)
    const [datePart, timePart] = dateString.split(' ');
    if (!datePart || !timePart) {
      return NextResponse.json(
        { success: false, message: 'Invalid date format. Expected: DD.MM.YYYY HH:mm:ss' },
        { status: 400 }
      );
    }

    const [day, month, year] = datePart.split('.');
    const [hour, minute, second] = timePart.split(':');

    if (!day || !month || !year || !hour || !minute || !second) {
      return NextResponse.json(
        { success: false, message: 'Invalid date format. Expected: DD.MM.YYYY HH:mm:ss' },
        { status: 400 }
      );
    }

    // Create date object in local time (Turkey time UTC+3)
    const localDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
    
    // Convert from Turkey time (UTC+3) to UTC
    const targetDate = new Date(localDate);
    targetDate.setHours(targetDate.getHours() - 3);
    
    // Create a wider range: 15 minutes before and 15 minutes after
    const startDate = new Date(targetDate);
    startDate.setMinutes(startDate.getMinutes() - 15);
    
    const endDate = new Date(targetDate);
    endDate.setMinutes(endDate.getMinutes() + 15);

    console.log('Searching for SMS messages between:');
    console.log('Start:', startDate.toISOString());
    console.log('End:', endDate.toISOString());

    // Find all SMS messages in this time range
    const { data: messages, error: fetchError } = await supabaseServer
      .from('sms_messages')
      .select('id, phone_number, sent_at, cost, status, user_id')
      .gte('sent_at', startDate.toISOString())
      .lte('sent_at', endDate.toISOString())
      .order('sent_at', { ascending: true });

    if (fetchError) {
      console.error('Failed to fetch messages:', fetchError);
      return NextResponse.json(
        { success: false, message: `Failed to fetch messages: ${fetchError.message}` },
        { status: 500 }
      );
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No messages found in the specified time range.',
        data: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          foundCount: 0,
        },
      });
    }

    console.log(`Found ${messages.length} messages in the specified time range.`);

    // Group by user to find the bulk send
    const userGroups = new Map<string, any[]>();
    messages.forEach((msg: any) => {
      const userId = msg.user_id;
      if (!userGroups.has(userId)) {
        userGroups.set(userId, []);
      }
      userGroups.get(userId)!.push(msg);
    });

    const results: any[] = [];

    // Process each user's messages
    for (const [userId, userMessages] of userGroups.entries()) {
      // If expectedCount is provided, only process groups that match
      if (expectedCount) {
        const countDiff = Math.abs(userMessages.length - expectedCount);
        if (countDiff > 10) { // Allow 10 messages difference
          continue;
        }
      }

      console.log(`\nProcessing user ${userId}: ${userMessages.length} messages`);

      // Count success/failed
      const successCount = userMessages.filter((m: any) =>
        m.status === 'iletildi' || m.status === 'delivered' || m.status === 'gönderildi' || m.status === 'sent'
      ).length;
      const failedCount = userMessages.filter((m: any) =>
        m.status === 'iletilmedi' || m.status === 'failed' || m.status === 'zaman_aşımı'
      ).length;

      console.log(`Success: ${successCount}, Failed: ${failedCount}`);

      // Check how many have cost=0 or null
      const needsUpdate = userMessages.filter((m: any) => {
        const cost = Number(m.cost) || 0;
        return cost === 0;
      });

      console.log(`Messages needing cost update: ${needsUpdate.length}`);

      if (needsUpdate.length > 0) {
        // Update all messages to cost=1
        const messageIds = needsUpdate.map((m: any) => m.id);

        console.log(`\nUpdating ${messageIds.length} messages to cost=1...`);

        // Update in batches of 100
        const batchSize = 100;
        let updatedCount = 0;
        let errorCount = 0;

        for (let i = 0; i < messageIds.length; i += batchSize) {
          const batch = messageIds.slice(i, i + batchSize);

          const { error: updateError } = await supabaseServer
            .from('sms_messages')
            .update({ cost: 1 })
            .in('id', batch);

          if (updateError) {
            console.error(`Error updating batch ${i / batchSize + 1}:`, updateError);
            errorCount += batch.length;
          } else {
            updatedCount += batch.length;
            console.log(`Updated batch ${i / batchSize + 1}: ${updatedCount}/${messageIds.length}`);
          }
        }

        results.push({
          userId,
          totalMessages: userMessages.length,
          successCount,
          failedCount,
          updatedCount,
          errorCount,
          alreadyHadCost: userMessages.length - needsUpdate.length,
        });

        console.log(`\n✅ Successfully updated ${updatedCount} messages to cost=1 for user ${userId}`);
      } else {
        console.log(`All messages already have cost set for user ${userId}.`);
        results.push({
          userId,
          totalMessages: userMessages.length,
          successCount,
          failedCount,
          updatedCount: 0,
          errorCount: 0,
          alreadyHadCost: userMessages.length,
        });
      }
    }

    if (results.length === 0) {
      return NextResponse.json({
        success: false,
        message: expectedCount
          ? `No bulk send found with approximately ${expectedCount} messages.`
          : 'No matching bulk sends found.',
        data: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          foundCount: messages.length,
          userGroups: Array.from(userGroups.keys()).map(userId => ({
            userId,
            messageCount: userGroups.get(userId)!.length,
          })),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${results.length} bulk send(s).`,
      data: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        results,
      },
    });
  } catch (error: any) {
    console.error('Error updating old bulk SMS cost:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

