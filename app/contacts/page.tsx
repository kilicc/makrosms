'use client';

import { 
  Box, Container, Typography, Paper, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  Alert, Chip, FormControl, InputLabel, Select, MenuItem, 
  CircularProgress, IconButton, InputAdornment, Tooltip,
  Stack, Tabs, Tab, Card, CardContent, Checkbox, Pagination
} from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Add, Edit, Delete, Phone, Email, 
  Search, CheckCircle, ImportExport, FileUpload,
  Group, People, Sms
} from '@mui/icons-material';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  tags: string[];
  contactCount?: number;
  group?: {
    id: string;
    name: string;
    color: string;
  };
}

interface ContactGroup {
  id: string;
  name: string;
  color: string;
  icon: string;
  contactCount: number;
}

export default function ContactsPage() {
  const { api } = useAuth();
  const { mode } = useTheme();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Tabs
  const [tabValue, setTabValue] = useState(0);
  
  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalContacts, setTotalContacts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Selection
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Dialogs
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editingGroup, setEditingGroup] = useState<ContactGroup | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
    groupId: '',
  });
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    color: '#8B5CF6',
    icon: 'group',
  });

  // Import state
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedGroupForImport, setSelectedGroupForImport] = useState<string>('');
  const [selectedNameColumn, setSelectedNameColumn] = useState<string>('');
  const [selectedPhoneColumn, setSelectedPhoneColumn] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadContacts();
    loadGroups();
  }, [page, searchQuery, groupFilter]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      if (groupFilter !== 'all') {
        if (groupFilter === 'none') {
          // For "none" we need to filter client-side or use a different approach
        } else {
          params.append('group', groupFilter);
        }
      }
      
      const response = await api.get(`/contacts?${params.toString()}`);
      if (response.data.success) {
        const data = response.data.data;
        setContacts(data.contacts || []);
        if (data.pagination) {
          setTotalContacts(data.pagination.total || 0);
          setTotalPages(data.pagination.totalPages || 0);
        }
      } else {
        setError(response.data.message || 'Kişiler yüklenirken bir hata oluştu');
      }
    } catch (error: any) {
      console.error('Contacts load error:', error);
      setError(error.response?.data?.message || 'Kişiler yüklenirken bir hata oluştu');
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const response = await api.get('/contact-groups');
      if (response.data.success) {
        setGroups(response.data.data.groups || []);
      }
    } catch (error: any) {
      console.error('Groups load error:', error);
      setGroups([]);
    }
  };

  // Filter contacts (client-side filtering for "none" group)
  const filteredContacts = contacts.filter((contact) => {
    if (groupFilter === 'none') {
      return !contact.group;
    }
    return true; // Server-side filtering handles the rest
  });
  
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedContacts(filteredContacts.map(c => c.id));
      setSelectAll(true);
    } else {
      setSelectedContacts([]);
      setSelectAll(false);
    }
  };
  
  const handleSelectContact = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };
  
  const handleDeleteSelected = async () => {
    if (selectedContacts.length === 0) return;
    
    if (!confirm(`${selectedContacts.length} kişiyi silmek istediğinizden emin misiniz?`)) return;
    
    try {
      setLoading(true);
      // Delete contacts one by one (or implement bulk delete endpoint)
      for (const id of selectedContacts) {
        await api.delete(`/contacts/${id}`);
      }
      setSuccess(`${selectedContacts.length} kişi silindi`);
      setSelectedContacts([]);
      setSelectAll(false);
      await Promise.all([loadContacts(), loadGroups()]);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Silme hatası');
    } finally {
      setLoading(false);
    }
  };

  const handleContactSubmit = async () => {
    try {
      setError('');
      if (editingContact) {
        await api.put(`/contacts/${editingContact.id}`, contactForm);
        setSuccess('Kişi güncellendi');
      } else {
        await api.post('/contacts', contactForm);
        setSuccess('Kişi eklendi');
      }
      setContactDialogOpen(false);
      setContactForm({ name: '', phone: '', email: '', notes: '', groupId: '' });
      setEditingContact(null);
      await Promise.all([loadContacts(), loadGroups()]);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'İşlem hatası');
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Bu kişiyi silmek istediğinizden emin misiniz?')) return;
    
    try {
      await api.delete(`/contacts/${id}`);
      setSuccess('Kişi silindi');
      await Promise.all([loadContacts(), loadGroups()]);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Silme hatası');
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension === 'csv' || fileExtension === 'xlsx' || fileExtension === 'xls') {
        setImportFile(file);
        setImportDialogOpen(true);
        setError('');
        setImportPreview(null);
        setSelectedNameColumn('');
        setSelectedPhoneColumn('');
        setSelectedGroupForImport('');
        
        try {
          setPreviewLoading(true);
          const formData = new FormData();
          formData.append('file', file);
          
          const response = await api.post('/contacts/import-preview', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          
          if (response.data.success) {
            const preview = response.data.data;
            setImportPreview(preview);
            
            // Auto-select columns
            const nameCol = Object.entries(preview.columnAnalysis || {})
              .find(([_, analysis]: [string, any]) => analysis.type === 'name' && analysis.confidence > 0.5)?.[0] || '';
            const phoneCol = Object.entries(preview.columnAnalysis || {})
              .find(([_, analysis]: [string, any]) => analysis.type === 'phone' && analysis.confidence > 0.5)?.[0] || 
              (preview.columns.length > 0 ? preview.columns[0] : '');
            
            setSelectedNameColumn(nameCol);
            setSelectedPhoneColumn(phoneCol || preview.columns[0] || '');
          } else {
            setError(response.data.message || 'Önizleme alınamadı');
          }
        } catch (err: any) {
          console.error('Preview error:', err);
          setError(err.response?.data?.message || 'Dosya analiz edilemedi');
        } finally {
          setPreviewLoading(false);
        }
      } else {
        setError('Sadece CSV veya Excel dosyaları destekleniyor');
      }
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setError('Dosya seçilmedi');
      return;
    }

    if (!selectedPhoneColumn) {
      setError('Lütfen telefon numarası sütununu seçin');
      return;
    }

    try {
      setImporting(true);
      setError('');
      
      const formData = new FormData();
      formData.append('file', importFile);
      
      // Debug: Log selected group before sending
      console.log('[Frontend Import] Selected group for import:', selectedGroupForImport);
      
      // Only append groupId if it's not empty
      if (selectedGroupForImport && selectedGroupForImport.trim() !== '') {
        formData.append('groupId', selectedGroupForImport.trim());
      }
      
      if (selectedNameColumn) {
        formData.append('nameColumn', selectedNameColumn);
      }
      if (selectedPhoneColumn) {
        formData.append('phoneColumn', selectedPhoneColumn);
      }

      const response = await api.post('/contacts/import-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        const resultData = response.data.data || {};
        setSuccess(response.data.message || `Import tamamlandı: ${resultData.success} başarılı, ${resultData.failed} başarısız`);
        setImportDialogOpen(false);
        setImportFile(null);
        setImportPreview(null);
        setSelectedGroupForImport('');
        setSelectedNameColumn('');
        setSelectedPhoneColumn('');
        await Promise.all([loadContacts(), loadGroups()]);
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(response.data.message || 'Import hatası');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Import hatası';
      const errorData = err.response?.data?.data || {};
      if (errorData.errors && errorData.errors.length > 0) {
        setError(`${errorMessage}. İlk hatalar: ${errorData.errors.slice(0, 3).join('. ')}`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const openEditDialog = (contact: Contact) => {
    setEditingContact(contact);
    setContactForm({
      name: contact.name,
      phone: contact.phone,
      email: contact.email || '',
      notes: contact.notes || '',
      groupId: contact.group?.id || '',
    });
    setContactDialogOpen(true);
  };

  const handleGroupSubmit = async () => {
    try {
      setError('');
      if (editingGroup) {
        await api.put(`/contact-groups/${editingGroup.id}`, groupForm);
        setSuccess('Grup güncellendi');
      } else {
        await api.post('/contact-groups', groupForm);
        setSuccess('Grup oluşturuldu');
      }
      setGroupDialogOpen(false);
      setGroupForm({ name: '', description: '', color: '#8B5CF6', icon: 'group' });
      setEditingGroup(null);
      await loadGroups();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'İşlem hatası');
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Bu grubu silmek istediğinizden emin misiniz? Gruba ait kişiler grupsuz olacak.')) return;
    
    try {
      await api.delete(`/contact-groups/${id}`);
      setSuccess('Grup silindi');
      await Promise.all([loadContacts(), loadGroups()]);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Silme hatası');
    }
  };

  const openEditGroupDialog = (group: ContactGroup) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      description: '',
      color: group.color,
      icon: group.icon,
    });
    setGroupDialogOpen(true);
  };

  const openNewGroupDialog = () => {
    setEditingGroup(null);
    setGroupForm({ name: '', description: '', color: '#8B5CF6', icon: 'group' });
    setGroupDialogOpen(true);
  };

  return (
    <ProtectedRoute>
      <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: mode === 'dark' ? '#121212' : '#f5f5f5' }}>
        <Navbar />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Container maxWidth="xl">
            {/* Header */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                Rehber
              </Typography>
              
              {/* Tabs */}
              <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
                <Tab icon={<People />} label="Kişiler" />
                <Tab icon={<Group />} label="Gruplar" />
              </Tabs>
            </Box>

            {/* Alerts */}
            {error && (
              <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            {/* Tab Content */}
            {tabValue === 0 && (
              <>
                {/* Contacts Header */}
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {totalContacts} kişi (Sayfa {page}/{totalPages || 1})
                    </Typography>
                    {selectedContacts.length > 0 && (
                      <Typography variant="body2" color="primary" sx={{ mt: 0.5 }}>
                        {selectedContacts.length} kişi seçildi
                      </Typography>
                    )}
                  </Box>
                  
                  <Stack direction="row" spacing={2}>
                    {selectedContacts.length > 0 && (
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<Delete />}
                        onClick={handleDeleteSelected}
                        sx={{ textTransform: 'none' }}
                      >
                        Seçilenleri Sil ({selectedContacts.length})
                      </Button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileSelect}
                      aria-label="Excel dosyası seç"
                      style={{ display: 'none' }}
                    />
                    <Button
                      variant="outlined"
                      startIcon={<FileUpload />}
                      onClick={() => fileInputRef.current?.click()}
                      sx={{ textTransform: 'none' }}
                    >
                      Excel Import
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => {
                        setEditingContact(null);
                        setContactForm({ name: '', phone: '', email: '', notes: '', groupId: '' });
                        setContactDialogOpen(true);
                      }}
                      sx={{ textTransform: 'none', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                    >
                      Yeni Kişi
                    </Button>
                  </Stack>
                </Box>

                {/* Filters */}
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
                    <Box sx={{ flex: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="İsim, telefon veya email ile ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Search />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Grup Filtresi</InputLabel>
                        <Select
                          value={groupFilter}
                          label="Grup Filtresi"
                          onChange={(e) => setGroupFilter(e.target.value)}
                        >
                          <MenuItem value="all">Tüm Gruplar</MenuItem>
                          <MenuItem value="none">Grupsuz</MenuItem>
                          {groups.map((group) => (
                            <MenuItem key={group.id} value={group.id}>
                              {group.name} ({group.contactCount})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </Stack>
                </Paper>

                {/* Contacts Table */}
            <Paper>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : filteredContacts.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {searchQuery || groupFilter !== 'all' ? 'Kişi bulunamadı' : 'Henüz kişi eklenmemiş'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {!searchQuery && groupFilter === 'all' && 'Yeni kişi ekleyin veya Excel dosyası import edin'}
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectAll}
                            indeterminate={selectedContacts.length > 0 && selectedContacts.length < filteredContacts.length}
                            onChange={handleSelectAll}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>İsim</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Telefon</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Grup</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="center">Mesaj</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">İşlemler</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredContacts.map((contact) => (
                        <TableRow key={contact.id} hover selected={selectedContacts.includes(contact.id)}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedContacts.includes(contact.id)}
                              onChange={() => handleSelectContact(contact.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {contact.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Phone fontSize="small" color="action" />
                              <Typography variant="body2">{contact.phone}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {contact.email ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Email fontSize="small" color="action" />
                                <Typography variant="body2">{contact.email}</Typography>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {contact.group ? (
                              <Chip
                                label={contact.group.name}
                                size="small"
                                sx={{
                                  bgcolor: contact.group.color,
                                  color: 'white',
                                  fontWeight: 500,
                                }}
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">Grup yok</Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                              <Sms fontSize="small" color="action" />
                              <Typography variant="body2">
                                {contact.contactCount || 0}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Tooltip title="Düzenle">
                                <IconButton size="small" onClick={() => openEditDialog(contact)}>
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Sil">
                                <IconButton size="small" color="error" onClick={() => handleDeleteContact(contact.id)}>
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              
              {/* Pagination */}
              {!loading && filteredContacts.length > 0 && totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(e, newPage) => {
                      setPage(newPage);
                      setSelectedContacts([]);
                      setSelectAll(false);
                    }}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </Paper>
              </>
            )}

            {/* Groups Tab */}
            {tabValue === 1 && (
              <>
                {/* Groups Header */}
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {groups.length} grup
                  </Typography>
                  
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={openNewGroupDialog}
                    sx={{ textTransform: 'none', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                  >
                    Yeni Grup
                  </Button>
                </Box>

                {/* Groups Grid */}
                {groups.length === 0 ? (
                  <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Henüz grup oluşturulmamış
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Kişilerinizi organize etmek için gruplar oluşturun
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={openNewGroupDialog}
                      sx={{ textTransform: 'none' }}
                    >
                      İlk Grubu Oluştur
                    </Button>
                  </Paper>
                ) : (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                    {groups.map((group) => (
                      <Card key={group.id}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: '50%',
                                  bgcolor: group.color,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontWeight: 600,
                                }}
                              >
                                <Group />
                              </Box>
                              <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                  {group.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {group.contactCount} kişi
                                </Typography>
                              </Box>
                            </Box>
                            <Stack direction="row" spacing={0.5}>
                              <Tooltip title="Düzenle">
                                <IconButton size="small" onClick={() => openEditGroupDialog(group)}>
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Sil">
                                <IconButton size="small" color="error" onClick={() => handleDeleteGroup(group.id)}>
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Box>
                          <Chip
                            label={group.name}
                            size="small"
                            sx={{
                              bgcolor: group.color,
                              color: 'white',
                              fontWeight: 500,
                            }}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}
              </>
            )}

            {/* Contact Dialog */}
            <Dialog open={contactDialogOpen} onClose={() => setContactDialogOpen(false)} maxWidth="sm" fullWidth>
              <DialogTitle>
                {editingContact ? 'Kişi Düzenle' : 'Yeni Kişi Ekle'}
              </DialogTitle>
              <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <TextField
                    fullWidth
                    label="İsim *"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    required
                  />
                  <TextField
                    fullWidth
                    label="Telefon *"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    required
                  />
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  />
                  <TextField
                    fullWidth
                    label="Notlar"
                    multiline
                    rows={3}
                    value={contactForm.notes}
                    onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                  />
                  <FormControl fullWidth>
                    <InputLabel>Grup</InputLabel>
                    <Select
                      value={contactForm.groupId}
                      label="Grup"
                      onChange={(e) => setContactForm({ ...contactForm, groupId: e.target.value })}
                    >
                      <MenuItem value="">Grup Yok</MenuItem>
                      {groups.map((group) => (
                        <MenuItem key={group.id} value={group.id}>
                          {group.name} ({group.contactCount})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setContactDialogOpen(false)}>İptal</Button>
                <Button onClick={handleContactSubmit} variant="contained" disabled={!contactForm.name || !contactForm.phone}>
                  {editingContact ? 'Güncelle' : 'Ekle'}
                </Button>
              </DialogActions>
            </Dialog>

            {/* Import Dialog */}
            <Dialog open={importDialogOpen} onClose={() => !importing && setImportDialogOpen(false)} maxWidth="md" fullWidth>
              <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ImportExport />
                  Excel/CSV Import
                </Box>
              </DialogTitle>
              <DialogContent>
                {previewLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : importPreview ? (
                  <Stack spacing={3} sx={{ mt: 1 }}>
                    <Alert severity="info">
                      <Typography variant="body2">
                        {importPreview.totalRows} satır bulundu. {importPreview.columns.length} sütun tespit edildi.
                      </Typography>
                    </Alert>

                    <FormControl fullWidth required>
                      <InputLabel>Telefon Sütunu *</InputLabel>
                      <Select
                        value={selectedPhoneColumn}
                        label="Telefon Sütunu *"
                        onChange={(e) => setSelectedPhoneColumn(e.target.value)}
                      >
                        {importPreview.columns.map((col: string) => {
                          const analysis = importPreview.columnAnalysis?.[col];
                          const isPhone = analysis?.type === 'phone';
                          return (
                            <MenuItem key={col} value={col}>
                              {col}
                              {isPhone && analysis.confidence > 0.5 && (
                                <Chip label="Otomatik" size="small" sx={{ ml: 1 }} color="success" />
                              )}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth>
                      <InputLabel>İsim Sütunu (Opsiyonel)</InputLabel>
                      <Select
                        value={selectedNameColumn}
                        label="İsim Sütunu (Opsiyonel)"
                        onChange={(e) => setSelectedNameColumn(e.target.value)}
                      >
                        <MenuItem value="">İsim Yok (Otomatik oluşturulacak)</MenuItem>
                        {importPreview.columns.map((col: string) => {
                          const analysis = importPreview.columnAnalysis?.[col];
                          const isName = analysis?.type === 'name';
                          return (
                            <MenuItem key={col} value={col}>
                              {col}
                              {isName && analysis.confidence > 0.5 && (
                                <Chip label="Otomatik" size="small" sx={{ ml: 1 }} color="primary" />
                              )}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth>
                      <InputLabel>Grup Seç (Opsiyonel)</InputLabel>
                      <Select
                        value={selectedGroupForImport}
                        label="Grup Seç (Opsiyonel)"
                        onChange={(e) => setSelectedGroupForImport(e.target.value)}
                      >
                        <MenuItem value="">Grup Yok</MenuItem>
                        {groups.map((group) => (
                          <MenuItem key={group.id} value={group.id}>
                            {group.name} ({group.contactCount} kişi)
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {importPreview.previewRows && importPreview.previewRows.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                          Önizleme (İlk 5 satır):
                        </Typography>
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                {importPreview.columns.map((col: string) => (
                                  <TableCell key={col} sx={{ fontWeight: 600, fontSize: '12px' }}>
                                    {col}
                                  </TableCell>
                                ))}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {importPreview.previewRows.map((row: any, idx: number) => (
                                <TableRow key={idx}>
                                  {importPreview.columns.map((col: string) => (
                                    <TableCell key={col} sx={{ fontSize: '12px' }}>
                                      {row[col] || '-'}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    )}
                  </Stack>
                ) : (
                  <Typography color="text.secondary">Dosya yükleniyor...</Typography>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setImportDialogOpen(false)} disabled={importing}>
                  İptal
                </Button>
                <Button
                  onClick={handleImport}
                  variant="contained"
                  disabled={importing || !importFile || !selectedPhoneColumn || previewLoading}
                  startIcon={importing ? <CircularProgress size={20} /> : <CheckCircle />}
                >
                  {importing ? 'Import Ediliyor...' : 'Import Et'}
                </Button>
              </DialogActions>
            </Dialog>

            {/* Group Dialog */}
            <Dialog open={groupDialogOpen} onClose={() => setGroupDialogOpen(false)} maxWidth="sm" fullWidth>
              <DialogTitle>
                {editingGroup ? 'Grup Düzenle' : 'Yeni Grup Oluştur'}
              </DialogTitle>
              <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <TextField
                    fullWidth
                    label="Grup Adı *"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                    required
                  />
                  <TextField
                    fullWidth
                    label="Açıklama"
                    multiline
                    rows={2}
                    value={groupForm.description}
                    onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  />
                  <FormControl fullWidth>
                    <InputLabel>Renk</InputLabel>
                    <Select
                      value={groupForm.color}
                      label="Renk"
                      onChange={(e) => setGroupForm({ ...groupForm, color: e.target.value })}
                    >
                      <MenuItem value="#8B5CF6">Mor</MenuItem>
                      <MenuItem value="#2196F3">Mavi</MenuItem>
                      <MenuItem value="#4CAF50">Yeşil</MenuItem>
                      <MenuItem value="#FF9800">Turuncu</MenuItem>
                      <MenuItem value="#F44336">Kırmızı</MenuItem>
                      <MenuItem value="#9C27B0">Pembe</MenuItem>
                      <MenuItem value="#00BCD4">Cyan</MenuItem>
                      <MenuItem value="#795548">Kahverengi</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setGroupDialogOpen(false)}>İptal</Button>
                <Button onClick={handleGroupSubmit} variant="contained" disabled={!groupForm.name}>
                  {editingGroup ? 'Güncelle' : 'Oluştur'}
                </Button>
              </DialogActions>
            </Dialog>
          </Container>
        </Box>
      </Box>
    </ProtectedRoute>
  );
}
