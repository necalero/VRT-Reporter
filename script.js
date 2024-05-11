const compareImages = require("resemblejs/compareImages");
const config = require("./config.json");
const fs = require('fs');
const { options } = config;

async function executeVRT() {
    console.log("test");

    let scenariosPath = `./Results`;

    let itemsInFolder = countItemsInFolder(scenariosPath);
    console.log(itemsInFolder);

    let directoryPath = scenariosPath;

    let scenarioNames = [];

    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return;
        }

        // Filter out only directories
        scenarioNames = files.filter(file => {
            return fs.statSync(`${directoryPath}/${file}`).isDirectory();
        });

        console.log('Directories:', scenarioNames);

        // Cycle through scenarios
        for(let i = 0; i<scenarioNames.length; i++)
        {
            let currentScenarioStepsPath = `./Results/${scenarioNames[i]}/Steps/`;
            fs.readdir(currentScenarioStepsPath, async (err, files) => {
                if (err) {
                    console.error('Error reading directory:', err);
                    return;
                }
        
                // Filter out only directories
                let steps = files.filter(file => {
                    return fs.statSync(`${currentScenarioStepsPath}/${file}`).isDirectory();
                });
        
                console.log('Step directories:', steps);
        
                // Cycle through steps
                for(let j = 0; j<steps.length; j++)
                {
                    let currentStepRoute = `./Results/${scenarioNames[i]}/Steps/${steps[j]}/`;
                    
                    try {
                        let beforeImageRoute = `${currentStepRoute}/before.png`; 
                        let afterImageRoute = `${currentStepRoute}/after.png`; 
                        const data = await compareImages(
                            fs.readFileSync(beforeImageRoute),
                            fs.readFileSync(afterImageRoute),
                            options
                        );
                        let resultInfo = {}
                        resultInfo[0] = {
                            isSameDimensions: data.isSameDimensions,
                            dimensionDifference: data.dimensionDifference,
                            rawMisMatchPercentage: data.rawMisMatchPercentage,
                            misMatchPercentage: data.misMatchPercentage,
                            diffBounds: data.diffBounds,
                            analysisTime: data.analysisTime
                        }

                        let comparedImage = data.getBuffer();
                        fs.writeFileSync(`./Results/${scenarioNames[i]}/Steps/${steps[j]}/compared.png`, comparedImage);

                        let stepReport = createStepReport(scenarioNames[i], steps[j], resultInfo[0]);
                        fs.writeFileSync(`./Results/${scenarioNames[i]}/Steps/${steps[j]}/report.html`, stepReport);
                        
                        
                    } catch (error) {
                        console.log(error);   
                    }
                }
        
                let scenarioReport =  createScenarioReport(scenarioNames[i], steps);
                fs.writeFileSync(`./Results/${scenarioNames[i]}/report.html`, scenarioReport);
            });

        }

        let vrtReport =  createVrtReport(scenarioNames);
        fs.writeFileSync(`./vrtReport.html`, vrtReport);
    });

    


}


function countItemsInFolder(folderPath) {
    try {
        // Read the contents of the folder synchronously
        const items = fs.readdirSync(folderPath);
        // Count the number of items
        const itemCount = items.length;
        return itemCount;
    } catch (error) {
        console.error('Error:', error);
        return -1; // Return -1 to indicate an error
    }
}


function createVrtReport(scenarios) {
    console.log(`Generating list items for: ${scenarios}`);

    // Generate list items dynamically based on scenarios array
    const listItems = scenarios.map(scenario => `
  <li class="link-list-item">
    <a href="./Results/${scenario}/report.html">${scenario}</a>
  </li>
`).join('');

    return `
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>VRT Report</title>
      <link rel="stylesheet" href="vrtReport.css" />
    </head>
    <body>
      <header>
        <h1>VRT Report</h1>
      </header>
      <main>
        <div id="visualizer">
          <h2>Please select the scenario you would like to inspect:</h2>
          <div class="item-list-container" id="scenario-list">
            <ul>
            ${listItems}
              
            </ul>
          </div>
        </div>
      </main>
    </body>
    </html>
    
    `
}

function createScenarioReport(scenarioName, steps) {
    console.log(`Generating list items for: ${steps}`);

    // Generate list items dynamically based on scenarios array
    const listItems = steps.map(step => `
    <div class="gallery-item">
    <a href="./Steps/${step}/report.html">
      <img src="./Steps/${step}/compared.png" alt="Step ${step}" />
      <h3>Step ${1}</h3>
    </a>
  </div>
`).join('');

    return `
    <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VRT Report</title>
    <link rel="stylesheet" href="../../vrtReport.css" />
  </head>
  <body>
    <header>
      <h1>${scenarioName} Report</h1>
    </header>
    <main>
      <div id="visualizer">
        <h2>Please select the step you would like to inspect:</h2>
        <div class="gallery-container" id="scenario-gallery">
          
          ${listItems}
        </div>
      </div>
    </main>
  </body>
</html>

    
    `
}

function createStepReport(scenarioName, step, comparisonInfo) {
    return `
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>VRT Report</title>
        <link rel="stylesheet" href="../../../../vrtReport.css" />
    </head>
    <body>
        <header>
        <h1>${scenarioName} - Step ${step} Report</h1>
        </header>
        <main>
        <div class="main-layout">
            <div class="comparison-info">
            <h2>Comparison Information</h2>
            <ul>
                <li>Same Dimensions: ${comparisonInfo.isSameDimensions} <span id="sameDimensions"></span></li>
                <li>MisMatch Percentage: ${comparisonInfo.misMatchPercentage} <span id="misMatchPercentage"></span></li>
                <li>Analysis Time: ${comparisonInfo.analysisTime} <span id="analysisTime"></span> ms</li>
            </ul>
            </div>

            <div class="report-visualizer">
            <div class="image-container">
                <div class="image">
                <img src="./before.png" alt="Before" />
                <h2>v3.42</h2>
                </div>
                <div class="image">
                <img src="./after.png" alt="After" />
                <h2>v5.14.1</h2>
                </div>
            </div>
            <div class="final-image-container">
                <img src="./compared.png" alt="Final" />
                <h2>Overlap</h2>
            </div>
            </div>
        </div>
        </main>
    </body>
    </html>
`
}

(async () => console.log(await executeVRT()))();