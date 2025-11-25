'use client';

import { 
  Box, Container, Typography, Paper, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  Alert, Chip, FormControl, InputLabel, Select, MenuItem, 
  CircularProgress, IconButton, InputAdornment, Tooltip,
  Stack
} from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Add, Edit, Delete, Phone, Email, 
  Search, CheckCircle, ImportExport, FileUpload
} from '@mui/icons-material';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  tags: string[];
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
  
  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  
  // Dialogs
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
    groupId: '',
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
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/contacts');
      if (response.data.success) {
        setContacts(response.data.data.contacts || []);
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

  // Filter contacts
  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery) ||
      (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesGroup = groupFilter === 'all' || 
      (groupFilter === 'none' && !contact.group) ||
      contact.group?.id === groupFilter;
    
    return matchesSearch && matchesGroup;
  });

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

  return (
    <ProtectedRoute>
      <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: mode === 'dark' ? '#121212' : '#f5f5f5' }}>
        <Navbar />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Container maxWidth="xl">
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Rehber
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {filteredContacts.length} kişi
                </Typography>
              </Box>
              
              <Stack direction="row" spacing={2}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
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
                        <TableCell sx={{ fontWeight: 600 }}>İsim</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Telefon</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Grup</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">İşlemler</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredContacts.map((contact) => (
                        <TableRow key={contact.id} hover>
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
            </Paper>

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
          </Container>
        </Box>
      </Box>
    </ProtectedRoute>
  );
}
