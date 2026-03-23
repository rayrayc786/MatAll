const xlsx = require('xlsx');
const path = require('path');

try {
  const filePath = path.join(__dirname, 'Data.xlsx');
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log('Headers:', data[0]);
  console.log('Sample Data (Row 1):', data[1]);
  process.exit(0);
} catch (err) {
  console.error('Error reading Excel:', err);
  process.exit(1);
}
