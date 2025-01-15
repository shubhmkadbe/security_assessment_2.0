
let currentlyFlipped = null; // Track the currently flipped tile

function toggleFlip(groupName, event) {
    const flipContainer = document.getElementById(`flip-${groupName}`);
    
    // Ignore clicks on child elements like inputs, labels, or paragraphs
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'LABEL' || event.target.tagName === 'P') {
        return; // Do nothing, let the input work as intended
    }

    // Close previously flipped tile if it exists and is not the same as the clicked tile
    if (currentlyFlipped && currentlyFlipped !== flipContainer) {
        currentlyFlipped.classList.remove('flipped');
    }

    // Toggle the current tile
    flipContainer.classList.toggle('flipped');

    // Update the currently flipped tile
    currentlyFlipped = flipContainer.classList.contains('flipped') ? flipContainer : null;
}


function getRandomColor() {
// Predefined list of 10 colors
const colors = [
"#e6e2d3",
"#dac292",
"#c4b7a6",
"#b9936c",
];

// Randomly pick a color from the array
return colors[Math.floor(Math.random() * colors.length)];
}
function applyRandomColors() {
const tiles = document.querySelectorAll('.flip-container'); // Select each tile
tiles.forEach(tile => {
const front = tile.querySelector('.front');
const back = tile.querySelector('.back');
const randomColor = getRandomColor();

// Apply the same random color to both front and back
front.style.backgroundColor = randomColor;
back.style.backgroundColor = randomColor;
});
}

// Apply colors when the page loads
document.addEventListener('DOMContentLoaded', applyRandomColors);
document.getElementById('surveyForm').addEventListener('submit', async function (event) {

    event.preventDefault();
    // 
    console.log('Submit button is pressed');

    // Collect form data
    const formData = new FormData(event.target);
    const data = {};
    formData.forEach((value, key) => {
        data[key] = value;
    });

    //     // Submit responses to the backend
    const response = await fetch('/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    document.getElementById('downloadBtn').style.display = 'block'; 

    const groupScores = await response.json();
    console.log(groupScores);

    const barColors =[
        "#E63946",
         " #F4A261",
         " #2A9D8F",
         " #264653",
          " #1D3557",

             " #457B9D",

             " #A8DADC",

              "rgb(57, 185, 14)",

"                  #E9C46A",
"                 #8D99AE",
"                  #6A0572"
    ];


    //     // Generate the chart
    const ctx = document.getElementById('resultsChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(groupScores),
            datasets: [{
                 label: 'Group Scores (Normalized to 100)',
                 data: Object.values(groupScores),
                backgroundColor: barColors,
                borderColor: barColors.map(color => color.replace(/(0?\.\d+|\d+)$/, "1")), //add solid boders 
                borderWidth: 1
            }]
        },
        options: {
            responsive: true, // Make the chart responsive
            plugins: {
                legend: {
                    display: true, // Enable the legend
                    position: 'top', // Position the legend at the top of the chart
                    labels: {
                        boxWidth: 20, // Width of the colored box next to the legend text
                        padding: 15 // Space between the legend items
                    }
                }
            },
            scales: {
                y: { beginAtZero: true, max: 100 }
            }
        }
    });

    // Create the custom legend
    const legendContainer = document.getElementById('legendContainer');
    legendContainer.innerHTML = ''; // Clear any previous legends

    // Generate legend items
    Object.keys(groupScores).forEach((group, index) => {
        const legendItem = document.createElement('div');
        legendItem.style.display = 'flex';
        legendItem.style.alignItems = 'center';
        legendItem.style.marginBottom = '10px';

        const colorBox = document.createElement('div');
        colorBox.style.width = '20px';
        colorBox.style.height = '20px';
        colorBox.style.backgroundColor = barColors[index];

        const groupName = document.createElement('span');
        groupName.style.marginLeft = '10px';
        groupName.textContent = group;

        legendItem.appendChild(colorBox);
        legendItem.appendChild(groupName);
        legendContainer.appendChild(legendItem);
    });
    // Enable download button
    document.getElementById('downloadBtn').disabled = false;
});

// Toggle visibility of questions when a group is clicked
function toggleQuestions(groupName) {
    const questionsDiv = document.getElementById(groupName);
    const isVisible = questionsDiv.style.display === 'block';
    questionsDiv.style.display = isVisible ? 'none' : 'block';
}

document.getElementById('downloadBtn').addEventListener('click', async function () {
    // Use html2canvas to capture the entire content (chart + legend)
    const contentToCapture = document.getElementById('contentToCapture'); // This is the div containing both the chart and the legend
    const contentDataURL = await html2canvas(contentToCapture).then((canvas) => {
        return canvas.toDataURL('image/png'); // Capture as PNG image
    });

    // Create a new PDF document using jsPDF
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    // Set PDF dimensions based on the captured content
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (contentToCapture.clientHeight * pdfWidth) / contentToCapture.clientWidth;

    // Add the image (chart + legend) to the PDF
    pdf.addImage(contentDataURL, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // Download the PDF
    pdf.save('ResultChartWithLegend.pdf');
});
