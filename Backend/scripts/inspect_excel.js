const xlsx = require('xlsx');
const path = require('path');

try {
  const filePath = path.join(__dirname, '..', '..', 'SAFE_Cleaned_Product_Master.xlsx');
  const workbook = xlsx.readFile(filePath, { sheetRows: 5 });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);
  
  console.log('Headers:', JSON.stringify(Object.keys(data[0])));
  console.log('Sample Data (Row 1):', JSON.stringify(data[0], null, 2));
  process.exit(0);
} catch (err) {
  console.error('Error reading Excel:', err);
  process.exit(1);
}
