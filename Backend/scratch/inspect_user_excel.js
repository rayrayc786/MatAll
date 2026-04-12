const xlsx = require('xlsx');
const path = require('path');

try {
  const filePath = "c:\\Users\\RahulArora\\Desktop\\BuildItQuick\\final_with_VAR_format (1).xlsx";
  const workbook = xlsx.readFile(filePath, { sheetRows: 5 });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);
  
  if (data.length > 0) {
    console.log('Headers found in file:');
    console.log(JSON.stringify(Object.keys(data[0]), null, 2));
    console.log('Sample Data (Row 1):');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('No data found in the first sheet.');
  }
  process.exit(0);
} catch (err) {
  console.error('Error reading Excel:', err);
  process.exit(1);
}
