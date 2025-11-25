/**
 * Script to update cost information for old bulk SMS sends
 * This script updates SMS messages sent on a specific date/time to have cost=1
 */

import { supabaseServer } from '../lib/supabase-server';

async function updateOldBulkSMSCost() {
  try {
    // Tarih: 25.11.2025 03:04:38 (muhtemelen 2024 olmalı, ama kullanıcının verdiği tarihi kullanıyoruz)
    // Format: DD.MM.YYYY HH:mm:ss
    const dateString = '25.11.2025 03:04:38';
    
    // Parse the date string
    const [datePart, timePart] = dateString.split(' ');
    const [day, month, year] = datePart.split('.');
    const [hour, minute, second] = timePart.split(':');
    
    // Create date object in local time (Turkey time UTC+3)
    // Then convert to UTC by subtracting 3 hours
    const localDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
    
    // If database stores in UTC, convert from Turkey time (UTC+3) to UTC
    // Subtract 3 hours
    const targetDate = new Date(localDate);
    targetDate.setHours(targetDate.getHours() - 3);
    
    // Create a wider range: 10 minutes before and 10 minutes after
    // This accounts for timezone differences and bulk send duration
    const startDate = new Date(targetDate);
    startDate.setMinutes(startDate.getMinutes() - 10);
    
    const endDate = new Date(targetDate);
    endDate.setMinutes(endDate.getMinutes() + 10);
    
    console.log('Searching for SMS messages between:');
    console.log('Start:', startDate.toISOString());
    console.log('End:', endDate.toISOString());
    
    // First, find all SMS messages in this time range
    const { data: messages, error: fetchError } = await supabaseServer
      .from('sms_messages')
      .select('id, phone_number, sent_at, cost, status, user_id')
      .gte('sent_at', startDate.toISOString())
      .lte('sent_at', endDate.toISOString())
      .order('sent_at', { ascending: true });
    
    if (fetchError) {
      throw new Error(`Failed to fetch messages: ${fetchError.message}`);
    }
    
    if (!messages || messages.length === 0) {
      console.log('No messages found in the specified time range.');
      console.log('Trying a wider range (10 minutes)...');
      
      // Try a wider range
      const widerStart = new Date(targetDate);
      widerStart.setMinutes(widerStart.getMinutes() - 5);
      const widerEnd = new Date(targetDate);
      widerEnd.setMinutes(widerEnd.getMinutes() + 5);
      
      const { data: widerMessages, error: widerError } = await supabaseServer
        .from('sms_messages')
        .select('id, phone_number, sent_at, cost, status, user_id')
        .gte('sent_at', widerStart.toISOString())
        .lte('sent_at', widerEnd.toISOString())
        .order('sent_at', { ascending: true });
      
      if (widerError) {
        throw new Error(`Failed to fetch messages: ${widerError.message}`);
      }
      
      if (!widerMessages || widerMessages.length === 0) {
        console.log('Still no messages found. Please check the date format and timezone.');
        return;
      }
      
      console.log(`Found ${widerMessages.length} messages in wider range.`);
      
      // Group by user and message to find the bulk send
      const userGroups = new Map<string, any[]>();
      widerMessages.forEach((msg: any) => {
        const userId = msg.user_id;
        if (!userGroups.has(userId)) {
          userGroups.set(userId, []);
        }
        userGroups.get(userId)!.push(msg);
      });
      
      // Find the group with ~998 messages
      for (const [userId, userMessages] of userGroups.entries()) {
        if (userMessages.length >= 990 && userMessages.length <= 1010) {
          console.log(`\nFound potential bulk send for user ${userId}: ${userMessages.length} messages`);
          
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
            
            for (let i = 0; i < messageIds.length; i += batchSize) {
              const batch = messageIds.slice(i, i + batchSize);
              
              const { error: updateError } = await supabaseServer
                .from('sms_messages')
                .update({ cost: 1 })
                .in('id', batch);
              
              if (updateError) {
                console.error(`Error updating batch ${i / batchSize + 1}:`, updateError);
              } else {
                updatedCount += batch.length;
                console.log(`Updated batch ${i / batchSize + 1}: ${updatedCount}/${messageIds.length}`);
              }
            }
            
            console.log(`\n✅ Successfully updated ${updatedCount} messages to cost=1`);
            return;
          } else {
            console.log('All messages already have cost set.');
          }
        }
      }
      
      console.log('\nCould not find a bulk send with ~998 messages. Please verify the date and time.');
      return;
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
    
    // Find the group with ~998 messages
    for (const [userId, userMessages] of userGroups.entries()) {
      if (userMessages.length >= 990 && userMessages.length <= 1010) {
        console.log(`\nFound potential bulk send for user ${userId}: ${userMessages.length} messages`);
        
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
          
          for (let i = 0; i < messageIds.length; i += batchSize) {
            const batch = messageIds.slice(i, i + batchSize);
            
            const { error: updateError } = await supabaseServer
              .from('sms_messages')
              .update({ cost: 1 })
              .in('id', batch);
            
            if (updateError) {
              console.error(`Error updating batch ${i / batchSize + 1}:`, updateError);
            } else {
              updatedCount += batch.length;
              console.log(`Updated batch ${i / batchSize + 1}: ${updatedCount}/${messageIds.length}`);
            }
          }
          
          console.log(`\n✅ Successfully updated ${updatedCount} messages to cost=1`);
        } else {
          console.log('All messages already have cost set.');
        }
      }
    }
    
  } catch (error: any) {
    console.error('Error updating old bulk SMS cost:', error);
    process.exit(1);
  }
}

// Run the script
updateOldBulkSMSCost()
  .then(() => {
    console.log('\nScript completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

