const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../allies.json');

// Read file
function loadData() {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({ config: {}, allies: {} }, null, 2));
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
}

// Save to file
function saveData(data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = { loadData, saveData };