const xlsx = require('xlsx');
const path = require('path');

async function compareFiles() {
  const oldFile = path.join(__dirname, '..', 'SAFE_Cleaned_Product_Master.xlsx');
  const newFile = path.join(__dirname, '..', 'Final_Full_Product_Master NEW.xlsx');

  try {
    console.log('Comparing files...');
    
    const oldWb = xlsx.readFile(oldFile);
    const newWb = xlsx.readFile(newFile);

    const oldSheet = oldWb.Sheets[oldWb.SheetNames[0]];
    const newSheet = newWb.Sheets[newWb.SheetNames[0]];

    // Get true headers from row 1
    const oldHeaders = xlsx.utils.sheet_to_json(oldSheet, { header: 1 })[0];
    const newHeaders = xlsx.utils.sheet_to_json(newSheet, { header: 1 })[0];

    console.log('--- OLD HEADERS ---');
    console.log(oldHeaders.filter(Boolean).join(', '));
    console.log('\n--- NEW HEADERS ---');
    console.log(newHeaders.filter(Boolean).join(', '));

    const added = newHeaders.filter(h => h && !oldHeaders.includes(h));
    const removed = oldHeaders.filter(h => h && !newHeaders.includes(h));

    console.log('\n--- CHANGES ---');
    console.log('Added headers:', added.length ? added.join(', ') : 'None');
    console.log('Removed headers:', removed.length ? removed.join(', ') : 'None');

    const newData = xlsx.utils.sheet_to_json(newSheet);
    // Find a row that might have more data
    const sampleRow = newData.find(r => r['Variant 4 Name'] || r['Variant 4 Value']) || newData[0];
    console.log('\nSample Data (Row with Var 4 if found):', JSON.stringify(sampleRow, null, 2));

  } catch (err) {
    console.error('Error comparing files:', err);
  }
}

compareFiles();
