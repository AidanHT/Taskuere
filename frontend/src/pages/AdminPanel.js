import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    CircularProgress,
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const AdminPanel = () => {
    // State variables for managing dialog visibility and user selection
    const [selectedUser, setSelectedUser] = useState(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [newRole, setNewRole] = useState('');
    const queryClient = useQueryClient(); // React Query client for cache management

    // Fetch all users from API with auth header
    const { data: users, isLoading } = useQuery('users', async () => {
        const token = localStorage.getItem('token');
        const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/users`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        return response.data;
    });

    // Mutation for updating user role
    const updateRole = useMutation(
        async ({ userId, role }) => {
            const token = localStorage.getItem('token');
            const response = await axios.patch(
                `${process.env.REACT_APP_API_URL}/api/users/${userId}/role`,
                { role },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            return response.data;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries('users');
                toast.success('User role updated successfully');
                handleCloseEditDialog();
            },
            onError: (error) => {
                toast.error(
                    error.response?.data?.message || 'Failed to update user role'
                );
            },
        }
    );

    // Delete user mutation with proper auth header
    const deleteUser = useMutation(
        async (userId) => {
            const token = localStorage.getItem('token');
            const response = await axios.delete(
                `${process.env.REACT_APP_API_URL}/api/users/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            return response.data;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries('users');
                toast.success('User deleted successfully');
                handleCloseDeleteDialog();
            },
            onError: (error) => {
                const errorMessage = error.response?.data?.message || 'Failed to delete user';
                toast.error(errorMessage);
                if (errorMessage === 'Cannot delete your own admin account') {
                    handleCloseDeleteDialog();
                }
            },
        }
    );

    // Open edit dialog and set user details
    const handleEditClick = (user) => {
        setSelectedUser(user);
        setNewRole(user.role);
        setIsEditDialogOpen(true);
    };

    // Open delete confirmation dialog
    const handleDeleteClick = (user) => {
        setSelectedUser(user);
        setIsDeleteDialogOpen(true);
    };

    // Close edit dialog
    const handleCloseEditDialog = () => {
        setIsEditDialogOpen(false);
        setSelectedUser(null);
        setNewRole('');
    };

    // Close delete dialog
    const handleCloseDeleteDialog = () => {
        setIsDeleteDialogOpen(false);
        setSelectedUser(null);
    };

    // Trigger update role mutation
    const handleUpdateRole = () => {
        if (selectedUser && newRole) {
            updateRole.mutate({ userId: selectedUser._id, role: newRole });
        }
    };

    // Add handle delete confirmation
    const handleDeleteConfirm = () => {
        if (selectedUser) {
            deleteUser.mutate(selectedUser._id);
        }
    };

    // Show loading spinner while fetching users
    if (isLoading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="60vh"
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Admin Panel
            </Typography>

            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    User Management
                </Typography>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Username</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell>Created At</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users?.map((user) => (
                                <TableRow key={user._id}>
                                    <TableCell>{user.username}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={user.role}
                                            color={user.role === 'admin' ? 'primary' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(user.createdAt), 'PPP')}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEditClick(user)}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDeleteClick(user)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Edit Role Dialog */}
            <Dialog
                open={isEditDialogOpen}
                onClose={handleCloseEditDialog}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Edit User Role</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <TextField
                            select
                            fullWidth
                            label="Role"
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                        >
                            <MenuItem value="user">User</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEditDialog}>Cancel</Button>
                    <Button
                        onClick={handleUpdateRole}
                        variant="contained"
                        disabled={!newRole || newRole === selectedUser?.role}
                    >
                        Update
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={isDeleteDialogOpen}
                onClose={handleCloseDeleteDialog}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Delete User</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this user? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={handleDeleteConfirm}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminPanel;
