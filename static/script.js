// Initialize Socket.IO connection
const socket = io('http://localhost:5000');

// Real-time donor matching
function updateDonorResults(donors) {
    const resultsDiv = document.getElementById('donor-results');
    if (!resultsDiv) {
        const container = document.querySelector('#donor-matching .max-w-2xl');
        const newResultsDiv = document.createElement('div');
        newResultsDiv.id = 'donor-results';
        newResultsDiv.className = 'mt-6 bg-white rounded-lg p-4 shadow';
        container.appendChild(newResultsDiv);
    }
    
    const html = donors.length ? `
        <h3 class="font-semibold mb-3">Available Donors:</h3>
        <ul class="space-y-2">
            ${donors.map(donor => `
                <li class="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                    <span>${donor.name}</span>
                    <span class="text-gray-600">${donor.distance} km away</span>
                </li>
            `).join('')}
        </ul>
    ` : '<p class="text-gray-600">No donors found for this blood type.</p>';
    
    document.getElementById('donor-results').innerHTML = html;
}

// Real-time supply monitoring
function updateSupplyStatus(supply) {
    const supplyDiv = document.getElementById('supply-status');
    if (!supplyDiv) {
        const container = document.querySelector('#features');
        const newSupplyDiv = document.createElement('div');
        newSupplyDiv.id = 'supply-status';
        newSupplyDiv.className = 'mt-12 grid md:grid-cols-4 gap-6';
        container.appendChild(newSupplyDiv);
    }
    
    const html = Object.entries(supply).map(([type, data]) => `
        <div class="bg-white rounded-xl shadow p-4">
            <h4 class="font-semibold text-lg mb-2">Type ${type}</h4>
            <div class="space-y-2">
                <p>Units: ${data.units}</p>
                <div class="flex items-center">
                    <span class="mr-2">Status:</span>
                    <span class="px-2 py-1 rounded text-sm ${
                        data.trend === 'critical' ? 'bg-red-100 text-red-800' :
                        data.trend === 'decreasing' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                    }">
                        ${data.trend}
                    </span>
                </div>
            </div>
        </div>
    `).join('');
    
    document.getElementById('supply-status').innerHTML = html;
}

// Event listeners and Socket.IO handlers
document.addEventListener('DOMContentLoaded', () => {
    // Donor search form handler
    const donorForm = document.querySelector('#donor-matching form');
    if (donorForm) {
        donorForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const bloodTypeSelect = donorForm.querySelector('select');
            const bloodType = bloodTypeSelect.options[bloodTypeSelect.selectedIndex]?.value;
            if (!bloodType) {
                alert('Please select a blood type');
                return;
            }
            const location = donorForm.querySelector('input[type="text"]').value;
            
            socket.emit('search_donors', { bloodType, location });
        });
    }

    // Appointment scheduling form handler
    const scheduleForm = document.querySelector('#schedule form');
    if (scheduleForm) {
        scheduleForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const date = scheduleForm.querySelector('input[type="date"]').value;
            const time = scheduleForm.querySelector('input[type="time"]').value;
            const location = scheduleForm.querySelector('select').value;
            
            socket.emit('schedule_appointment', { date, time, location });
        });
    }

    // Socket.IO event handlers
    socket.on('donor_results', (data) => {
        updateDonorResults(data.donors);
    });

    socket.on('supply_update', (data) => {
        updateSupplyStatus(data);
    });

    socket.on('appointment_confirmed', (data) => {
        const scheduleDiv = document.querySelector('#schedule .max-w-2xl');
        const confirmationDiv = document.createElement('div');
        confirmationDiv.className = 'mt-6 bg-green-100 text-green-800 p-4 rounded-lg';
        confirmationDiv.innerHTML = `
            <h4 class="font-semibold mb-2">Appointment Confirmed!</h4>
            <p>Appointment ID: ${data.appointment_id}</p>
            <p>Date: ${data.date}</p>
            <p>Time: ${data.time}</p>
            <p>Location: ${data.location}</p>
        `;
        scheduleDiv.appendChild(confirmationDiv);
    });

    // Initial supply check
    socket.emit('check_supply');
});
