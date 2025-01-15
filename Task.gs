class Task {
  constructor(skillArea, taskID, points, taskName) {
    this.skillArea = skillArea;
    this.taskID = taskID;
    this.points = points;
    this.taskName = taskName;
  }

  printTask() {
    console.log(`Skill Area: ${this.skillArea}`);
    console.log(`Task ID: ${this.taskID}`);
    console.log(`Points: ${this.points}`);
    console.log(`Task Name: ${this.taskName}`);
    console.log("");
  }
}