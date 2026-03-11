import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sample booking data - comprehensive examples
const data = [
  {
    'Booking ID': 'BOOKING-001',
    'Guest Name': 'John Doe',
    'Guest Email': 'john.doe@example.com',
    'Guest Phone': '9876543210',
    'Room ID': 'room-001',
    'Check-In': '2025-02-15',
    'Check-Out': '2025-02-18',
    'Status': 'confirmed',
    'ID Verified': 'approved',
    'Total Price': 4500,
    'Payment Status': 'paid',
  },
  {
    'Booking ID': 'BOOKING-002',
    'Guest Name': 'Jane Smith',
    'Guest Email': 'jane.smith@example.com',
    'Guest Phone': '9876543211',
    'Room ID': 'room-002',
    'Check-In': '2025-02-20',
    'Check-Out': '2025-02-23',
    'Status': 'pending',
    'ID Verified': 'pending',
    'Total Price': 9000,
    'Payment Status': 'pending',
  },
  {
    'Booking ID': 'BOOKING-003',
    'Guest Name': 'Robert Johnson',
    'Guest Email': 'robert.johnson@example.com',
    'Guest Phone': '9876543212',
    'Room ID': 'room-003',
    'Check-In': '2025-02-25',
    'Check-Out': '2025-02-26',
    'Status': 'checked-in',
    'ID Verified': 'approved',
    'Total Price': 2500,
    'Payment Status': 'paid',
  },
  {
    'Booking ID': 'BOOKING-004',
    'Guest Name': 'Sarah Williams',
    'Guest Email': 'sarah.williams@example.com',
    'Guest Phone': '9876543213',
    'Room ID': 'room-004',
    'Check-In': '2025-03-01',
    'Check-Out': '2025-03-05',
    'Status': 'confirmed',
    'ID Verified': 'approved',
    'Total Price': 12000,
    'Payment Status': 'paid',
  },
  {
    'Booking ID': 'BOOKING-005',
    'Guest Name': 'Michael Brown',
    'Guest Email': 'michael.brown@example.com',
    'Guest Phone': '9876543214',
    'Room ID': 'room-005',
    'Check-In': '2025-03-10',
    'Check-Out': '2025-03-12',
    'Status': 'checked-out',
    'ID Verified': 'approved',
    'Total Price': 6000,
    'Payment Status': 'paid',
  },
  {
    'Booking ID': 'BOOKING-006',
    'Guest Name': 'Emily Davis',
    'Guest Email': 'emily.davis@example.com',
    'Guest Phone': '9876543215',
    'Room ID': 'room-001',
    'Check-In': '2025-03-15',
    'Check-Out': '2025-03-17',
    'Status': 'pending',
    'ID Verified': 'pending',
    'Total Price': 4500,
    'Payment Status': 'pending',
  },
  {
    'Booking ID': 'BOOKING-007',
    'Guest Name': 'David Wilson',
    'Guest Email': 'david.wilson@example.com',
    'Guest Phone': '9876543216',
    'Room ID': 'room-002',
    'Check-In': '2025-03-20',
    'Check-Out': '2025-03-22',
    'Status': 'confirmed',
    'ID Verified': 'approved',
    'Total Price': 6000,
    'Payment Status': 'pending',
  },
  {
    'Booking ID': 'BOOKING-008',
    'Guest Name': 'Lisa Anderson',
    'Guest Email': 'lisa.anderson@example.com',
    'Guest Phone': '9876543217',
    'Room ID': 'room-003',
    'Check-In': '2025-03-25',
    'Check-Out': '2025-03-28',
    'Status': 'cancelled',
    'ID Verified': 'rejected',
    'Total Price': 7500,
    'Payment Status': 'failed',
  },
];

// Create workbook
const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Bookings');

// Write file
const filePath = path.join(__dirname, 'public', 'sample_bookings.xlsx');
XLSX.writeFile(wb, filePath);
console.log(`Sample bookings file created at ${filePath}`);
