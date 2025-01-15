var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

function getIDsFromNames(names) {
  var [ taskMap, _ ] = getTasks();
  nameArray = names.split('\n');
  var ids = [];

  for (var name of nameArray) {
    let id = getIDFromName(name, taskMap);
    if (id != -1) {
      ids.push(id);
    }
  }

  return ids;
}

function getIDFromName(name, taskMap) {
  for(var [taskID, task] of taskMap) {
    if (task.taskName == name) {
      return taskID;
    }
  }

  return -1;
}

function formatTasks() {
  [ taskMap, _ ] = getTasks();
  const skillAreas = {};

  taskMap.forEach((task, _) => {
    if (!skillAreas[task.skillArea]) {
      skillAreas[task.skillArea] = { tasks: [] };
    }

    skillAreas[task.skillArea].tasks.push(task.taskName);
  });

  return JSON.stringify(skillAreas);
}

function getTasks() {
  var taskMap = new Map();
  var skillAreas = new Map();

  var sourceSheet = spreadsheet.getSheetByName("Tasks");
  var lastRow = sourceSheet.getLastRow();

  var values = sourceSheet.getRange(2, 1, lastRow - 1, 7);
  values = values.getValues();

  for(var value of values) {
    var skillArea = value[0];
    var taskID = value[6];
    var points = value[3];
    var taskName = value[1];

    if(skillArea != '' && taskID != '' && points != '') {
      var newTask = new Task(skillArea, taskID, points, taskName);
      taskMap.set(taskID, newTask);

      if (!(skillArea in skillAreas)) {
        skillAreas.set(value[0], 0);
      }
    }
  }

  return [taskMap, skillAreas];
}

function getTaskLog() {
  var sourceSheet = spreadsheet.getSheetByName("Task Log");
  var lastRow = sourceSheet.getLastRow();

  // start at row 2 col 2, and grab all the existing TaskIDs
  var values = sourceSheet.getRange(2, 2, lastRow - 1, 1);
  return values.getValues().map(x => x[0]);
}

function addUpSkillPoints() {
  var completedTaskIDs = getTaskLog();
  var [ taskMap, skillAreas ] = getTasks(); // Destructure the object returned by getTasks()

  // Iterate over completedTaskIDs and update skillAreas
  for (var taskID of completedTaskIDs) {
    var task = taskMap.get(taskID);
    if (task) {
      var currentCount = skillAreas.get(task.skillArea);
      skillAreas.set(task.skillArea, currentCount + task.points);
    }
  }

  return skillAreas;
}

// TODO - call this for every onChange event
function updateSkillPoints() {
  var skillPoints = addUpSkillPoints();
  var targetSheet = spreadsheet.getSheetByName("Levels");
  var namedRanges = targetSheet.getNamedRanges();

  // points is on row 13
  // level is on row 14
  for (var range of namedRanges) {
    var name = range.getName();
    var points = skillPoints.get(name) || 0;
    console.log(`Name: ${name}, Points: ${points}`);
    console.log(range.getRange().getColumn());

    var col = range.getRange().getColumn() + 1;
    var row = 14;

    targetSheet.getRange(row, col).setValue(points);
  }
}

// update skill points every time we add a log
// function onEdit(e) {
//   const sheet = e.source.getActiveSheet();
//   const targetSheetName = "Task Log";

//   if (sheet.getName() !== targetSheetName) {
//     return;
//   }

//   // TODO
//   return;
// }

// call this endpoint with <web-app-url>?endpoint=getTasks
function doGet(e) {
  const endpoint = e.parameter.endpoint; // Extract the 'endpoint' query parameter
  Logger.log(`endpoint: ${endpoint}`);

  return ContentService.createTextOutput(formatTasks())
    .setMimeType(ContentService.MimeType.JSON);
    // .setHeader('Access-Control-Allow-Origin', '*');

  // switch (endpoint) {
  //   case 'getTasks':
  //     return ContentService.createTextOutput(formatTasks()).setMimeType(ContentService.MimeType.JSON);
  //   // case 'getSpecificRow':
  //   //   return getSpecificRow(e.parameter.rowIndex); // Pass additional query parameters
  //   // case 'getColumnData':
  //   //   return getColumnData(e.parameter.columnIndex); // Pass additional query parameters
  //   default:
  //     return ContentService.createTextOutput(
  //       JSON.stringify({ error: 'Invalid endpoint' })
  //     ).setMimeType(ContentService.MimeType.JSON);
  // }
}

function doPost(e) {
  // TODO - put all of these at the top of the scope
  var targetSheet = spreadsheet.getSheetByName("Task Log");
  // var lastRow = targetSheet.getLastRow();

  try {
    const body = JSON.parse(e.postData.contents);
    // FIXME - ideally, we would use task ID, but this is hard to do in shortcuts, maybe ask GPT later
    const taskNames = body.taskNames;
    const taskIDs = getIDsFromNames(taskNames);
    const date = body.date;

    // console.log(`task IDs: ${taskIDs}`);
    // console.log(`task Names: ${taskNames}`);


    // if (taskID == -1) {
    //   throw new Error(`Task with that name does not exist or doesn\'t have associated ID ${e.postData.contents}`);
    // }

    // console.log(`${taskID} was done at ${date}`);
    for (var taskID of taskIDs) {
      targetSheet.appendRow([date, taskID]);
    }

    const responseData = { status: 'success', message: 'Data received' };

    return ContentService.createTextOutput(JSON.stringify(responseData))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    const errorResponse = { status: 'error', message: error.message };

    return ContentService.createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

