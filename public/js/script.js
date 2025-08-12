
const firebaseConfig = {
  apiKey: "AIzaSyDeUTafZWpu4ZKl37AVHEX4GR3rQv4sqyw",
  authDomain: "dashboard-61ee7.firebaseapp.com",
  databaseURL: "https://dashboard-61ee7-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dashboard-61ee7",
  storageBucket: "dashboard-61ee7.firebasestorage.app",
  messagingSenderId: "261964668241",
  appId: "1:261964668241:web:69d060b2cff9da47c4c770",
  measurementId: "G-F16QHJEQNW"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const trashBinsRef = database.ref('/trash_bins');

const dashboardGrid = document.getElementById('dashboard-grid');
const urgentBinsContainer = document.getElementById('urgent-bins-container');
const addBinForm = document.getElementById('add-bin-form');

// Function to create an individual bin card HTML element
function createBinCard(bin) {
    const card = document.createElement('div');
    card.className = 'bin-card bg-[#2D3748] p-6 rounded-lg shadow-lg';
    card.id = `bin-${bin.binId}`;

    let fillLevelColor = 'fill-level-green';
    if (bin.fillLevel >= 50 && bin.fillLevel <= 75) {
        fillLevelColor = 'fill-level-yellow';
    } else if (bin.fillLevel > 75) {
        fillLevelColor = 'fill-level-red';
    }

    // Google Maps iframe URL with dark theme styling
    const mapUrl = `https://maps.google.com/maps?q=${bin.latitude},${bin.longitude}&hl=es&z=14&output=embed`;

    card.innerHTML = `
        <div class="flex items-start justify-between mb-4">
            <div>
                <h3 class="text-2xl font-bold mb-1">${bin.binId}</h3>
                <p class="text-sm text-[#A0AEC0]">${bin.address}</p>
            </div>
            <div class="fill-level-container">
                <div class="fill-level-bar ${fillLevelColor}" style="height: ${bin.fillLevel}%;"></div>
            </div>
        </div>
        <div class="w-full h-48 rounded-lg overflow-hidden mt-4 mb-4">
            <iframe
                class="google-maps-iframe w-full h-full"
                loading="lazy"
                allowfullscreen
                referrerpolicy="no-referrer-when-downgrade"
                src="${mapUrl}">
            </iframe>
        </div>
        <button data-bin-id="${bin.binId}" class="remove-bin-btn w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-300">Remove Bin</button>
    `;

    return card;
}

// Function to update the urgent bins section
function updateUrgentBins(bins) {
    const urgentBins = Object.values(bins).filter(bin => bin.fillLevel > 75);
    urgentBinsContainer.innerHTML = ''; // Clear previous content

    if (urgentBins.length === 0) {
        urgentBinsContainer.innerHTML = '<p>No bins are currently over 75% full.</p>';
    } else {
        urgentBins.forEach(bin => {
            const binElement = document.createElement('p');
            binElement.className = 'py-1 text-red-400 font-semibold';
            binElement.textContent = `🚨 ${bin.binId} is ${bin.fillLevel}% full at ${bin.address}.`;
            urgentBinsContainer.appendChild(binElement);
        });
    }
}

// Initial state: display 10 mock bins
function displayMockBins() {
    for (let i = 1; i <= 10; i++) {
        const binId = `mock_bin_${String(i).padStart(2, '0')}`;
        const mockBin = {
            binId: binId,
            address: `Mock Address ${i}`,
            latitude: 34.0522 + (Math.random() - 0.5) * 0.1, // Random latitudes near LA
            longitude: -118.2437 + (Math.random() - 0.5) * 0.1, // Random longitudes near LA
            fillLevel: 0
        };
        dashboardGrid.appendChild(createBinCard(mockBin));
    }
}
displayMockBins();


// Listen for real-time data changes from Firebase
trashBinsRef.on('value', (snapshot) => {
    const bins = snapshot.val();
    if (!bins) {
        dashboardGrid.innerHTML = '';
        urgentBinsContainer.innerHTML = '<p>No bins are currently over 75% full.</p>';
        return;
    }

    // Clear the mock bins and the grid before populating with real data
    dashboardGrid.innerHTML = '';

    // Update the dashboard with real data
    Object.values(bins).forEach(bin => {
        dashboardGrid.appendChild(createBinCard(bin));
    });

    // Update the urgent bins section
    updateUrgentBins(bins);
});


// Handle manual bin submission
addBinForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const binId = document.getElementById('binId').value;
    const address = document.getElementById('address').value;
    const latitude = parseFloat(document.getElementById('latitude').value);
    const longitude = parseFloat(document.getElementById('longitude').value);
    const fillLevel = parseInt(document.getElementById('fillLevel').value);

    // Validate fill level
    if (fillLevel < 0 || fillLevel > 100) {
        alert("Fill Level must be between 0 and 100.");
        return;
    }

    const newBinData = {
        binId: binId,
        address: address,
        latitude: latitude,
        longitude: longitude,
        fillLevel: fillLevel
    };

    // Push new data to Firebase
    trashBinsRef.child(binId).set(newBinData)
        .then(() => {
            alert('New bin added successfully!');
            addBinForm.reset();
        })
        .catch((error) => {
            console.error("Error adding new bin: ", error);
            alert('Failed to add new bin. See console for details.');
        });
});

// Event delegation for the remove button
dashboardGrid.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-bin-btn')) {
        const binId = e.target.dataset.binId;
        if (confirm(`Are you sure you want to remove bin ${binId}?`)) {
            // Remove the bin from Firebase
            trashBinsRef.child(binId).remove()
                .then(() => {
                    console.log(`Bin ${binId} removed successfully.`);
                })
                .catch((error) => {
                    console.error("Error removing bin: ", error);
                    alert('Failed to remove bin. See console for details.');
                });
        }
    }
});