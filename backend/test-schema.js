// Test script to verify ConflictResolutions schema fix
require('dotenv').config();
const mongoose = require('mongoose');
const ConflictResolutions = require('./src/models/ConflictResolutions');

async function testSchema() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskuere');
        console.log('Connected to MongoDB');

        // Create a test ConflictResolution document
        const testConflictResolution = new ConflictResolutions({
            user: new mongoose.Types.ObjectId(),
            originalRequest: {
                rawText: 'Meeting with John tomorrow at 6 PM',
                parsedIntent: {
                    title: 'Meeting with John',
                    datetime: new Date('2025-08-08T22:00:00.000Z'),
                    duration: 60,
                    attendees: [],
                    location: '',
                    type: 'meeting'
                },
                confidence: 1.0
            },
            conflicts: [{
                conflictType: 'time_overlap',
                severity: 'medium',
                description: 'Test conflict'
            }],
            suggestedResolutions: [{
                type: 'reschedule',
                reason: 'Avoiding conflict',
                confidence: 0.8,
                pros: ['Better time slot'],
                cons: ['Later in the day']
            }],
            aiReasoning: 'Test AI reasoning',
            status: 'pending'
        });

        // Validate the document
        await testConflictResolution.validate();
        console.log('✅ Schema validation passed!');

        // Test save operation
        await testConflictResolution.save();
        console.log('✅ Document saved successfully!');

        // Clean up
        await ConflictResolutions.deleteOne({ _id: testConflictResolution._id });
        console.log('✅ Test document cleaned up');

        console.log('🎉 All tests passed! The schema fix is working correctly.');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('Disconnected from MongoDB');
    }
}

testSchema();
