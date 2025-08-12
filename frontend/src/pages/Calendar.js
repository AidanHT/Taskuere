import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Paper,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';

const validationSchema = Yup.object({
    title: Yup.string().required('Title is required'),
    description: Yup.string(),
    location: Yup.string(),
    type: Yup.string().required('Type is required'),
    startTime: Yup.date().required('Start time is required'),
    endTime: Yup.date()
        .required('End time is required')
        .min(Yup.ref('startTime'), 'End time must be after start time'),
});

const Calendar = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const location = useLocation();

    // Fetch appointments
    const { data: appointments } = useQuery('appointments', async () => {
        const token = localStorage.getItem('token');
        const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/appointments`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    });

    // Create appointment mutation
    const createAppointment = useMutation(
        async (values) => {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/appointments`,
                values,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries('appointments');
                toast.success('Appointment created successfully');
                handleCloseModal();
            },
            onError: (error) => {
                toast.error(error.response?.data?.message || 'Failed to create appointment');
            },
        }
    );

    // Update appointment mutation
    const updateAppointment = useMutation(
        async ({ id, values }) => {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/api/appointments/${id}`,
                values,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries('appointments');
                toast.success('Appointment updated successfully');
                handleCloseModal();
            },
            onError: (error) => {
                toast.error(error.response?.data?.message || 'Failed to update appointment');
            },
        }
    );

    // Delete appointment mutation
    const deleteAppointment = useMutation(
        async (id) => {
            const token = localStorage.getItem('token');
            await axios.delete(
                `${process.env.REACT_APP_API_URL}/api/appointments/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries('appointments');
                toast.success('Appointment deleted successfully');
                handleCloseModal();
            },
            onError: (error) => {
                toast.error(error.response?.data?.message || 'Failed to delete appointment');
            },
        }
    );

    const formik = useFormik({
        initialValues: {
            title: '',
            description: '',
            location: '',
            type: 'appointment',
            startTime: new Date(),
            endTime: new Date(new Date().setHours(new Date().getHours() + 1)),
        },
        validationSchema,
        onSubmit: async (values) => {
            const appointmentData = {
                ...values,
                startTime: values.startTime.toISOString(),
                endTime: values.endTime.toISOString(),
            };

            if (selectedEvent) {
                updateAppointment.mutate({
                    id: selectedEvent.id,
                    values: appointmentData,
                });
            } else {
                createAppointment.mutate(appointmentData);
            }
        },
    });

    const handleDateSelect = (selectInfo) => {
        setSelectedEvent(null);
        formik.setValues({
            ...formik.initialValues,
            startTime: selectInfo.start,
            endTime: selectInfo.end || new Date(selectInfo.start.getTime() + 3600000), // Default 1 hour duration
        });
        setIsModalOpen(true);
    };

    const handleEventClick = async (clickInfo) => {
        setSelectedEvent(clickInfo.event);
        formik.setValues({
            title: clickInfo.event.title,
            description: clickInfo.event.extendedProps.description || '',
            location: clickInfo.event.extendedProps.location || '',
            type: clickInfo.event.extendedProps.type || 'appointment',
            startTime: new Date(clickInfo.event.start),
            endTime: new Date(clickInfo.event.end || clickInfo.event.start),
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedEvent(null);
        formik.resetForm();
    };

    const handleDelete = () => {
        if (selectedEvent) {
            deleteAppointment.mutate(selectedEvent.id);
        }
    };

    const events = appointments?.map((appointment) => ({
        id: appointment._id,
        title: appointment.title,
        start: appointment.startTime,
        end: appointment.endTime,
        extendedProps: {
            description: appointment.description,
            location: appointment.location,
            type: appointment.type,
        },
    })) || [];

    // Instant meeting quick start via query param
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const instant = params.get('instantMeeting');
        if (instant) {
            const now = new Date();
            const end = new Date(now.getTime() + 30 * 60000);
            createAppointment.mutate({
                title: 'Instant Meeting',
                description: 'Quick start collaborative meeting',
                location: 'Online',
                type: 'meeting',
                startTime: now.toISOString(),
                endTime: end.toISOString(),
            }, {
                onSuccess: (appt) => {
                    navigate(`/collaboration/${appt._id}`);
                }
            });
            // remove the param to avoid repeated creation
            navigate('/calendar', { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Box sx={{ height: 'calc(100vh - 100px)' }}>
            <Paper elevation={6} sx={{ p: 3, height: '100%', borderRadius: 3 }}>
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay',
                    }}
                    initialView="dayGridMonth"
                    editable={true}
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={true}
                    weekends={true}
                    events={events}
                    select={handleDateSelect}
                    eventClick={handleEventClick}
                    height="100%"
                />
            </Paper>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Dialog open={isModalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                    <DialogTitle>
                        {selectedEvent ? 'Edit Appointment' : 'New Appointment'}
                    </DialogTitle>
                    <form onSubmit={formik.handleSubmit}>
                        <DialogContent>
                            <TextField
                                fullWidth
                                margin="normal"
                                name="title"
                                label="Title"
                                value={formik.values.title}
                                onChange={formik.handleChange}
                                error={formik.touched.title && Boolean(formik.errors.title)}
                                helperText={formik.touched.title && formik.errors.title}
                            />
                            <TextField
                                fullWidth
                                margin="normal"
                                name="description"
                                label="Description"
                                multiline
                                rows={4}
                                value={formik.values.description}
                                onChange={formik.handleChange}
                            />
                            <TextField
                                fullWidth
                                margin="normal"
                                name="location"
                                label="Location"
                                value={formik.values.location}
                                onChange={formik.handleChange}
                            />
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Type</InputLabel>
                                <Select
                                    name="type"
                                    value={formik.values.type}
                                    onChange={formik.handleChange}
                                    label="Type"
                                >
                                    <MenuItem value="appointment">Appointment</MenuItem>
                                    <MenuItem value="meeting">Meeting</MenuItem>
                                    <MenuItem value="reminder">Reminder</MenuItem>
                                </Select>
                            </FormControl>
                            <Box sx={{ mt: 2 }}>
                                <DateTimePicker
                                    label="Start Time"
                                    value={formik.values.startTime}
                                    onChange={(value) => formik.setFieldValue('startTime', value)}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            margin: 'normal',
                                            error: formik.touched.startTime && Boolean(formik.errors.startTime),
                                            helperText: formik.touched.startTime && formik.errors.startTime,
                                        },
                                    }}
                                />
                                <DateTimePicker
                                    label="End Time"
                                    value={formik.values.endTime}
                                    onChange={(value) => formik.setFieldValue('endTime', value)}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            margin: 'normal',
                                            error: formik.touched.endTime && Boolean(formik.errors.endTime),
                                            helperText: formik.touched.endTime && formik.errors.endTime,
                                        },
                                    }}
                                />
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            {selectedEvent && (
                                <Button
                                    onClick={handleDelete}
                                    color="error"
                                    disabled={deleteAppointment.isLoading}
                                >
                                    Delete
                                </Button>
                            )}
                            <Button onClick={handleCloseModal}>Cancel</Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={createAppointment.isLoading || updateAppointment.isLoading}
                            >
                                {selectedEvent ? 'Update' : 'Create'}
                            </Button>
                            {selectedEvent && (
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate(`/collaboration/${selectedEvent.id}`)}
                                >
                                    Open Collaboration
                                </Button>
                            )}
                        </DialogActions>
                    </form>
                </Dialog>
            </LocalizationProvider>
        </Box>
    );
};

export default Calendar; 