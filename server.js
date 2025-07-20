require("dotenv").config();
// Import required modules
const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer"); // Import nodemailer for email functionality
const axios = require("axios");
const session = require('express-session');
const fs = require("fs");
const { Parser } = require("json2csv");
const botToken = process.env.BOT_TOKEN; // Your bot token from BotFather
const AdminchatIds =  process.env.ADMIN
  ? process.env.ADMIN.split(',').map(id => parseInt(id.trim()))
  : [];

const chatIds = process.env.USERS
  ? process.env.USERS.split(',').map(id => parseInt(id.trim()))
  : [];
const FormData = require("form-data");
const { exec } = require("child_process");
const apiUrl = process.env.GITHUB_API;
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const token = process.env.GITHUB_TOKEN



// Create an instance of the Express application
const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

// Use body-parser middleware to parse JSON requests
app.use(bodyParser.json());

// Email configuration (Make sure to set up your email and password correctly)
const transporter = nodemailer.createTransport({
  service: "gmail", // Use your email service
  auth: {
    user: emailUser, // Your email
    pass: emailPass, // Your email password
  },
});

const sendTelegramReply = async (chatId, message) => {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  let value;
  try {
    await axios.post(url, {
      chat_id: chatId,  // Use chatId from the function parameter
      text: message,
    });
    return 0;
  } catch (error) {
    console.error("Error sending message to Telegram:", error);
     return 1;
  }
};


const sendTelegramMessageToIndividual = async (chatId,message) => {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: chatId,
      text: message,
    });
  } catch (error) {
    console.error("Error sending message to Telegram:", error);
  }
};

const sendTelegramMessageToMany = async (chatId, message) => {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: chatId,
      text: message,
    });
  } catch (error) {
    console.error("Error sending message to Telegram:", error);
  }
};

async function appendDataToCSV(newData) {
  try {
    // Get the current content of the file from GitHub
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    const fileContent = response.data.content;
    const fileSha = response.data.sha; // The current sha of the file

    // Decode the base64 file content
    const decodedContent = Buffer.from(fileContent, "base64").toString("utf8");

    // Append new data to the file
    const updatedContent = decodedContent + "\n" + newData;

    // Encode the updated content to base64
    const base64UpdatedContent = Buffer.from(updatedContent).toString("base64");

    // Create the request body for the GitHub API
    const updateData = {
      message: "Update data.csv with new data",
      content: base64UpdatedContent,
      sha: fileSha, // This is required for updating the file
    };

    // Update the file on GitHub via PUT request
    const updateResponse = await axios.put(apiUrl, updateData, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    console.log("Data appended successfully to data.csv on GitHub");
  } catch (error) {
    console.error("Error appending data to CSV:", error);
  }
}

// Define the webhook endpoint
app.post("/webhook", async (req, res) => {
  const { Parser } = require("json2csv"); // Assuming you are using json2csv library
let chatId;
  try {
    const update = req.body;
    try {
      console.log(update.originalDetectIntentRequest.payload.data);
      chatId = update.originalDetectIntentRequest.payload.data.chat.id;
    } catch (error) {
      console.log("No chat ID found or an error occurred.");
    }

    // Extract the payload data and format the date
    const data = update.originalDetectIntentRequest.payload.data;
    const timestamp = data.date;
    const formattedDate = new Date(timestamp * 1000).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });

    // Replace the `date` field in `data` with `formattedDate`
    data.date = formattedDate;

    // Extract the fields from `data` you want to store in CSV
    const fields = [
      "message_id",
      "date",
      "chat.id",
      "chat.type",
      "from.id",
      "from.username",
      "from.first_name",
      "text",
    ];

    // Convert JSON data to CSV
    const json2csvParser = new Parser({ fields, header: false });
    const csv = json2csvParser.parse(data);

    // Append the CSV data to your file (assuming you have an appendDataToCSV function)
    appendDataToCSV(csv);

    // Log the CSV output
    console.log(csv);
  } catch (error) {
    console.error(
      "An error occurred while processing the webhook:",
      error.message
    );
  }
  
  const AdminName={5928914069:'Virochana-1', 6562925416:'Virochana-2'};

  // Append the CSV data to a file

  const intentName = req.body.queryResult.intent.displayName;
  let dayOfWeek = 0;

  // Define schedules for each day
  const schedules = {
    0: "\nNo classes on Sunday.", // Sunday
    1: "\n9:00 AM - OS, \n9:55 AM - CN, \n11:05 AM - DS, \n12:00 PM - DAA, \n1:40 PM - OS.", // Monday
    2: "\n9:00 AM - ANN, \n11:05 AM - CN Lab (B1).", // Tuesday
    3: "\n9:00 AM - OS, \n9:55 AM - LH, \n11:05 AM - DAA, \n12:00 PM - Free Hour, \n1:40 PM - DAA Lab (B1) / OS Lab (B2).", // Wednesday
    4: "\n9:00 AM - DAA, \n11:05 AM - CN, \n1:40 PM - CN Lab (B2).", // Thursday
    5: "\n9:00 AM - CN, \n9:55 AM - DS, \n11:05 AM - OS Lab (B1) / DAA Lab (B2), \n1:40 PM - ANN.", // Friday
    6: "\n9:00 AM - DS, \n9:55 AM - Free Hour, \n11:05 AM - ANN, \n12:00 PM - OS.", // Saturday
  };

  // Map numeric days to names
  const dayNames = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
  };

  // Define faculty names by subject
  const facultyNames = {
    S0: "Class Advisor of 5th Sem AIML is \nMr. Mahesh Kumar",
    S1: "Introduction to Artificial Neural Networks (22SAL051)  \nMr. Mahesh Kumar",
    S2: "Operating Systems (22SAL052)  \nMrs. Varsha",
    S3: "Computer Networks (22SAL053)  \nMrs. Thanmayee",
    S4: "Design and Analysis of Algorithm (22SAL054)  \nMs. Swarna",
    S5: "Introduction to Data Science (22SAL553)  \nMs. Veeda",
  };

  const deadlines = {
    S1: {
      name: "Introduction to Artificial Neural Networks",
      deadlines: [
        {
          name: "Assignment",
          description:
            "Subject: Introduction to Artificial Neural Networks\nTask: Assignment\nLast Date: 26-10-2024\n",
          submissionDate: new Date("2024-10-26T16:00:00"),
        },
        {
          name: "Seminar",
          description:
            "Subject: Introduction to Artificial Neural Networks\nTask: Seminar\nLast Date: 26-10-2024\n",
          submissionDate: new Date("2024-10-26T16:00:00"),
        },
      ],
    },
    S2: {
      name: "Operating Systems",
      deadlines: [
        {
          name: "Assignment",
          description:
            "Subject: Operating Systems\nTask: Assignment\nLast Date: 26-10-2024\n",
          submissionDate: new Date("2024-10-26T16:00:00"),
        },
        {
          name: "Seminar",
          description:
            "Subject: Operating Systems\nTask: Seminar\nLast Date: 26-10-2024\n",
          submissionDate: new Date("2024-10-26T16:00:00"),
        },
        {
          name: "Mini Project",
          description:
            "Subject: Operating Systems\nTask: Mini Project\nLast Date: 26-10-2024\n",
          submissionDate: new Date("2024-10-26T16:00:00"),
        },
        {
          name: "Record",
          description:
            "Subject: Operating Systems\nTask: Record\nLast Date: 26-10-2024\n",
          submissionDate: new Date("2024-10-26T16:00:00"),
        },
      ],
    },
    S3: {
      name: "Computer Networks",
      deadlines: [
        {
          name: "Assignment",
          description:
            "Subject: Computer Networks\nTask: Assignment\nLast Date: 26-10-2024\n",
          submissionDate: new Date("2024-10-26T16:00:00"),
        },
        {
          name: "Seminar",
          description:
            "Subject: Computer Networks\nTask: Seminar\nLast Date: 26-10-2024\n",
          submissionDate: new Date("2024-10-26T16:00:00"),
        },
        {
          name: "Mini Project",
          description:
            "Subject: Computer Networks\nTask: Mini Project\nLast Date: 26-10-2024\n",
          submissionDate: new Date("2024-10-26T16:00:00"),
        },
        {
          name: "Record",
          description:
            "Subject: Computer Networks\nTask: Record\nLast Date: 26-10-2024\n",
          submissionDate: new Date("2024-10-26T16:00:00"),
        },
      ],
    },
    S4: {
      name: "Design and Analysis of Algorithm",
      deadlines: [
        {
          name: "Assignment",
          description:
            "Subject: Design and Analysis of Algorithm\nTask: Assignment\nLast Date: 26-10-2024\n",
          submissionDate: new Date("2024-10-26T16:00:00"),
        },
        {
          name: "Seminar",
          description:
            "Subject: Design and Analysis of Algorithm\nTask: Seminar\nLast Date: 26-10-2024\n",
          submissionDate: new Date("2024-10-26T16:00:00"),
        },
        {
          name: "Mini Project",
          description:
            "Subject: Design and Analysis of Algorithm\nTask: Mini Project\nLast Date: 26-10-2024\n",
          submissionDate: new Date("2024-10-26T16:00:00"),
        },
        {
          name: "Record",
          description:
            "Subject: Design and Analysis of Algorithm\nTask: Record\nLast Date: 26-10-2024\n",
          submissionDate: new Date("2024-10-26T16:00:00"),
        },
      ],
    },
    S5: {
      name: "Introduction to Data Science",
      deadlines: [
        {
          name: "Assignment",
          description:
            "Subject: Introduction to Data Science\nTask: Assignment\nLast Date: 26-10-2024\n",
          submissionDate: new Date("2024-10-26T16:00:00"),
        },
        {
          name: "Seminar",
          description:
            "Subject: Introduction to Data Science\nTask: Seminar\nLast Date: 26-10-2024\n",
          submissionDate: new Date("2024-10-26T16:00:00"),
        },
      ],
    },
    S6: {
      name: "Others",
      deadlines: [
        {
          name: "Certification",
          description:
            "Subject: Others\nTask: Certification\nLast Date: 26-10-2024\n",
          submissionDate: new Date("2024-10-26T16:00:00"),
        },
        {
          name: "Soft Skills",
          description:
            "Subject: Others\nTask: Soft Skills\nLast Date: 26-10-2024\n",
          submissionDate: new Date("2024-10-26T16:00:00"),
        },
        {
          name: "Mini Project",
          description:
            "Subject: Others\nTask: Mini Project(50 marks)\nLast Date: 26-10-2024\n",
          submissionDate: new Date("2024-10-26T16:00:00"),
        },
        {
          name: "Internship",
          description:
            "Subject: Others\nTask: Internship\nLast Date: 26-10-2024\n",
          submissionDate: new Date("2024-10-26T16:00:00"),
        },
      ],
    },
  };

  const exams = {
    E1: "Introduction to Artificial Neural Network - \n\nTheory exam - \n22/11/2024 (Friday) \n2:00 PM to 4:00 PM .",
    E2: "Operating Systems - \n\nTheory exam - \n20/11/2024 (Wednesday) \n2:00 PM to 4:00 PM .",
    E3: "Computer Networks - \n\nTheory exam - \n25/11/2024 (Monday) \n2:00 PM to 4:00 PM .",
    E4: "Design and Analysis of Algorithm - \n\nTheory exam - \n27/11/2024 (Wednesday) \n2:00 PM to 4:00 PM .",
    E5: "Introduction to Data Science - \n\nTheory exam - \n29/11/2024 (Friday) \n2:00 PM to 4:00 PM .",
    E6: [
      "Batch 1 - \n7/11/2024 \n8:30 to 11:30",
      "Batch 2 - \n7/11/2024 \n11:30 to 14:30",
      "Batch 3 - \n7/11/2024 \n14:30 to 17:30",
      "Batch 4 - \n8/11/2024 \n8:30 to 11:30",
      "Batch 5 - \n8/11/2024 \n11:30 to 14:30",
      "Batch 6 - \n8/11/2024 \n14:30 to 17:30",
      "Batch 7 - \n9/11/2024 \n8:30 to 11:30",
    ],
    E7: [
      "Batch 1 - \n9/11/2024 \n8:30 to 11:30",
      "Batch 2 - \n9/11/2024 \n11:30 to 14:30",
      "Batch 3 - \n9/11/2024 \n14:30 to 17:30",
      "Batch 4 - \n11/11/2024 \n8:30 to 11:30",
      "Batch 5 - \n11/11/2024 \n11:30 to 14:30",
      "Batch 6 - \n11/11/2024 \n14:30 to 17:30",
      "Batch 7 - \n12/11/2024 \n8:30 to 11:30",
    ],
  };

  const weeklySchedule = {
    0: [],
    1: [
      { time: "09:00", subject: "Operating Systems" },
      { time: "09:55", subject: "Computer Networks" },
      { time: "11:05", subject: "Introduction to Data Science" },
      { time: "12:00", subject: "Design and Analysis of Algorithm" },
      { time: "13:40", subject: "Operating Systems" },
    ],
    2: [
      { time: "09:00", subject: "Introduction to Artificial Neural Networks" },
      { time: "11:05", subject: "Computer Networks Lab (Batch-1)" },
    ],
    3: [
      { time: "09:00", subject: "Operating Systems" },
      { time: "09:55", subject: "Library Hour" },
      { time: "11:05", subject: "Design and Analysis of Algorithm" },
      { time: "12:00", subject: "Free Hour" },
      {
        time: "13:40",
        subject:
          "Design and Analysis of Algorithm Lab (Batch-1) / Operating Systems Lab (Batch-2)",
      },
    ],
    4: [
      { time: "09:00", subject: "Design and Analysis of Algorithm" },
      { time: "11:05", subject: "Computer Networks" },
      { time: "13:40", subject: "Computer Networks Lab (Batch-2)" },
    ],
    5: [
      { time: "09:00", subject: "Computer Networks" },
      { time: "09:55", subject: "Introduction to Data Science" },
      {
        time: "11:05",
        subject:
          "Operating Systems Lab (Batch-1) / Design and Analysis of Algorithm Lab (Batch-2)",
      },
      { time: "13:40", subject: "Introduction to Artificial Neural Networks" },
    ],
    6: [
      { time: "09:00", subject: "Introduction to Data Science" },
      { time: "09:55", subject: "Free Hour" },
      { time: "11:05", subject: "Introduction to Artificial Neural Networks" },
      { time: "12:00", subject: "Operating Systems" },
    ],
  };

  const classDurations = {
    1: [
      { start: "09:00", end: "09:55", subject: "Operating Systems" },
      { start: "09:55", end: "10:50", subject: "Computer Networks" },
      { start: "11:05", end: "12:00", subject: "Introduction to Data Science" },
      {
        start: "12:00",
        end: "12:55",
        subject: "Design and Analysis of Algorithm",
      },
      { start: "13:40", end: "14:35", subject: "Operating Systems" },
    ],
    2: [
      {
        start: "09:00",
        end: "10:50",
        subject: "Introduction to Artificial Neural Networks",
      },
      {
        start: "11:05",
        end: "12:55",
        subject: "Computer Networks Lab (Batch-1)",
      },
    ],
    3: [
      { start: "09:00", end: "09:55", subject: "Operating Systems" },
      { start: "09:55", end: "10:50", subject: "Library Hour" },
      {
        start: "11:05",
        end: "12:00",
        subject: "Design and Analysis of Algorithm",
      },
      { start: "12:00", end: "12:55", subject: "Free Hour" },
      {
        start: "13:40",
        end: "15:35",
        subject:
          "Design and Analysis of Algorithm Lab (Batch-1) / Operating Systems Lab (Batch-2)",
      },
    ],
    4: [
      {
        start: "09:00",
        end: "10:50",
        subject: "Design and Analysis of Algorithm",
      },
      { start: "11:05", end: "12:55", subject: "Computer Networks" },
      {
        start: "13:40",
        end: "15:35",
        subject: "Computer Networks Lab (Batch-2)",
      },
    ],
    5: [
      { start: "09:00", end: "09:55", subject: "Computer Networks" },
      { start: "09:55", end: "10:50", subject: "Introduction to Data Science" },
      {
        start: "11:05",
        end: "12:55",
        subject:
          "Operating Systems Lab (Batch-1) / Design and Analysis of Algorithm Lab (Batch-2)",
      },
      {
        start: "13:40",
        end: "15:35",
        subject: "Introduction to Artificial Neural Networks",
      },
    ],
    6: [
      { start: "09:00", end: "09:55", subject: "Introduction to Data Science" },
      { start: "09:55", end: "10:50", subject: "Free Hour" },
      {
        start: "11:05",
        end: "12:00",
        subject: "Introduction to Artificial Neural Networks",
      },
      { start: "12:00", end: "12:55", subject: "Operating Systems" },
    ],
  };

  const ClassSchedule = {
    CS1: {
      // Introduction to Artificial Neural Networks
      name: "Introduction to Artificial Neural Networks",
      schedule: [
        { day: 2, start: "09:00", end: "10:50" }, // Tuesday
        { day: 5, start: "13:40", end: "15:35" }, // Friday
        { day: 6, start: "11:05", end: "12:00" }, // Saturday
      ],
    },
    CS2: {
      // Operating Systems
      name: "Operating Systems",
      schedule: [
        { day: 1, start: "09:00", end: "09:55" }, // Monday
        { day: 1, start: "13:40", end: "14:35" }, // Monday
        { day: 3, start: "09:00", end: "09:55" }, // Wednesday
        { day: 6, start: "12:00", end: "12:55" }, // Saturday
      ],
    },
    CS3: {
      // Computer Networks
      name: "Computer Networks",
      schedule: [
        { day: 1, start: "09:55", end: "10:50" }, // Monday
        { day: 4, start: "11:05", end: "12:55" }, // Thursday
        { day: 5, start: "09:00", end: "09:55" }, // Friday
      ],
    },
    CS4: {
      // Design and Analysis of Algorithm
      name: "Design and Analysis of Algorithm",
      schedule: [
        { day: 1, start: "12:00", end: "12:55" }, // Monday
        { day: 3, start: "11:05", end: "12:00" }, // Wednesday
        { day: 4, start: "09:00", end: "10:50" }, // Thursday
      ],
    },
    CS5: {
      // Introduction to Data Science
      name: "Introduction to Data Science",
      schedule: [
        { day: 1, start: "11:05", end: "12:00" }, // Monday
        { day: 5, start: "09:55", end: "10:50" }, // Friday
        { day: 6, start: "09:00", end: "09:55" }, // Saturday
      ],
    },
    CS6: {
      // Operating Systems Lab
      name: "Operating Systems Lab",
      schedule: [
        { day: 3, start: "13:40", end: "15:35", batch: "Batch-2" }, // Wednesday
        { day: 5, start: "11:05", end: "12:55", batch: "Batch-1" }, // Friday
      ],
    },
    CS7: {
      // Computer Networks Lab
      name: "Computer Networks Lab",
      schedule: [
        { day: 2, start: "11:05", end: "12:55", batch: "Batch-1" }, // Tuesday
        { day: 4, start: "13:40", end: "15:35", batch: "Batch-2" }, // Thursday
      ],
    },
    CS8: {
      // Design and Analysis of Algorithm Lab
      name: "Design and Analysis of Algorithm Lab",
      schedule: [
        { day: 3, start: "13:40", end: "15:35", batch: "Batch-1" }, // Wednesday
        { day: 5, start: "11:05", end: "12:55", batch: "Batch-2" }, // Friday
      ],
    },
    CS9: {
      // Free Hour/Mentor Hour
      name: "Free Hour/Mentor Hour/Library Hour",
      schedule: [
        { day: 3, start: "09:55", end: "10:50" }, // Wednesday
        { day: 3, start: "12:00", end: "12:55" }, // Wednesday
        { day: 6, start: "09:55", end: "10:50" }, // Saturday
      ],
    },
  };

  const examDates = {
    E1: new Date("2024-11-22T14:00:00"), // Example date and time for Exam ED1
    E2: new Date("2024-11-20T14:00:00"),
    E3: new Date("2024-11-25T14:00:00"),
    E4: new Date("2024-11-27T14:00:00"),
    E5: new Date("2024-11-29T14:00:00"),
    E6: [
      new Date("2024-11-07T08:30:00"), // Batch 1
      new Date("2024-11-07T11:30:00"), // Batch 2
      new Date("2024-11-07T14:30:00"), // Batch 3
      new Date("2024-11-08T08:30:00"), // Batch 4
      new Date("2024-11-08T11:30:00"), // Batch 5
      new Date("2024-11-08T14:30:00"), // Batch 6
      new Date("2024-11-09T08:30:00"), // Batch 7
    ],
    E7: [
      new Date("2024-11-09T08:30:00"), // Batch 1
      new Date("2024-11-09T11:30:00"), // Batch 2
      new Date("2024-11-09T14:30:00"), // Batch 3
      new Date("2024-11-11T08:30:00"), // Batch 4
      new Date("2024-11-11T11:30:00"), // Batch 5
      new Date("2024-11-11T14:30:00"), // Batch 6
      new Date("2024-11-12T08:30:00"), // Batch 7
    ],
  };

  const Period = {
    1: "09:01",
    2: "09:56",
    3: "11:06",
    4: "12:01",
    5: "13:41",
    6: "14:36",
    7: "15:36",
    8: ["13:41", "12:01", "14:41", "14:41", "14:41", "12:01"],
  };
  const Subject = {
    E1: "Introduction to Artificial Neural Network",
    E2: "Operating Systems",
    E3: "Computer Networks",
    E4: "Design and Analysis of Algorithm",
    E5: "Introduction to Data Science",
  };

  const sub = {
    S1: "ann",
    S2: "os",
    S3: "cn",
    S4: "daa",
    S5: "ds",
  };
  const Modules = ["module-1", "module-2", "module-3", "module-4", "module-5"];

  // Function to find the period details for a specific time
  function getPeriodDetails(dayOfWeek, time) {
    const periods = classDurations[dayOfWeek];
    for (const period of periods) {
      const startTime = new Date(`1970-01-01T${period.start}:00`);
      const endTime = new Date(`1970-01-01T${period.end}:00`);
      const currentTime = new Date(`1970-01-01T${time}:00`);
      // Check if the current time falls within the period
      if (currentTime >= startTime && currentTime < endTime) {
        return `${period.subject} from ${period.start} to ${period.end}.`;
      }
    }

    return "No class at this time.";
  }

  // Find the next upcoming exam
  function findNextExams() {
    const now = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    const currentIST = new Date(now);

    let nextExams = [];
    let nextExamTime = null;

    // Check all exams
    for (const exam in examDates) {
      const dates = Array.isArray(examDates[exam])
        ? examDates[exam]
        : [examDates[exam]];

      for (const date of dates) {
        if (date > currentIST) {
          // If it's the first future exam or earlier than the current nextExamTime, update nextExamTime
          if (!nextExamTime || date < nextExamTime) {
            nextExamTime = date;
            nextExams = [{ exam, date }]; // Reset nextExams to only this exam
          } else if (date.getTime() === nextExamTime.getTime()) {
            // If date matches nextExamTime, add it to the nextExams array
            nextExams.push({ exam, date });
          }
        }
      }
    }

    return { nextExams, nextExamTime };
  }

  function calculateTimeLeft(examDate) {
    const now = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    const currentIST = new Date(now);

    const timeDifference = examDate - currentIST;

    if (timeDifference <= 0) return "The exam has already started or passed.";

    const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor(
      (timeDifference % (1000 * 60 * 60)) / (1000 * 60)
    );

    return `${days} days, ${hours} hours, and ${minutes} minutes remaining.`;
  }

  function isClassToday(classCode) {
    const now = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    const today = new Date(now);
    const todayDay = today.getDay(); // getDay() returns 0 for Sunday, 1 for Monday, ..., 6 for Saturday

    // Access the specific class schedule using the provided class code
    const classInfo = ClassSchedule[classCode];

    // Check if the class schedule exists
    if (!classInfo) {
      return `Class code ${classCode} is not found in the schedule.`;
    }

    // Search for today's schedule in the class's schedule array
    let todaySchedule = classInfo.schedule.find(
      (schedule) => schedule.day == todayDay
    );
    // Check if the class is scheduled today and return appropriate message
    if (todaySchedule) {
      if (todaySchedule.batch) {
        return `You have ${classInfo.name} scheduled today for ${todaySchedule.batch} from ${todaySchedule.start} to ${todaySchedule.end}.`;
      } else {
        return `You have ${classInfo.name} scheduled today from ${todaySchedule.start} to ${todaySchedule.end}.`;
      }
    } else {
      let next;
      let i = 1;
      while (!todaySchedule && i < 7) {
        next = (Number(todayDay) + i) % 7;
        todaySchedule = classInfo.schedule.find(
          (schedule) => schedule.day == next
        );
        i++;
      }
      if (todaySchedule) {
        if (todaySchedule.batch) {
          return `You don't have ${classInfo.name} scheduled today.`;
        } else {
          if (todayDay == (next + 6) % 7) {
            return `You don't have ${classInfo.name} scheduled today.\n\nYou have ${classInfo.name} scheduled tomorrow from ${todaySchedule.start} to ${todaySchedule.end}`;
          } else {
            return `You don't have ${classInfo.name} scheduled today.\n\nYou have ${classInfo.name} scheduled on ${dayNames[next]} from ${todaySchedule.start} to ${todaySchedule.end}`;
          }
        }
      } else {
        return "I couldn't find the schedule for the specified subject. \nTry agian by typing subject/faculty name correctly.";
      }
    }
  }

  function isClassTomorrow(classCode) {
    const now = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    const today = new Date(now);
    const todayDay = today.getDay() + 1; // getDay() returns 0 for Sunday, 1 for Monday, ..., 6 for Saturday
    // Access the specific class schedule using the provided class code
    const classInfo = ClassSchedule[classCode];

    // Check if the class schedule exists
    if (!classInfo) {
      return `Class code ${classCode} is not found in the schedule.`;
    }

    // Search for today's schedule in the class's schedule array
    let todaySchedule = classInfo.schedule.find(
      (schedule) => schedule.day == todayDay
    );

    // Check if the class is scheduled today and return appropriate message
    if (todaySchedule) {
      if (todaySchedule.batch) {
        return `You have ${classInfo.name} scheduled tomorrow for ${todaySchedule.batch} from ${todaySchedule.start} to ${todaySchedule.end}.`;
      } else {
        return `You have ${classInfo.name} scheduled tomorrow from ${todaySchedule.start} to ${todaySchedule.end}.`;
      }
    } else {
      let next;
      let i = 1;
      while (!todaySchedule && i < 7) {
        next = (Number(todayDay) + i) % 7;
        todaySchedule = classInfo.schedule.find(
          (schedule) => schedule.day == next
        );
        i++;
      }
      if (todaySchedule) {
        if (todaySchedule.batch) {
          return `You don't have ${classInfo.name} scheduled tomorrow.`;
        } else {
          return `You don't have ${classInfo.name} scheduled tomorrow.\n\nYou have ${classInfo.name} scheduled on ${dayNames[next]} from ${todaySchedule.start} to ${todaySchedule.end}`;
        }
      } else {
        return "I couldn't find the schedule for the specified subject. \nTry agian by typing subject/faculty name correctly.";
      }
    }
  }

  function wasClassYesterday(classCode) {
    const now = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    const today = new Date(now);
    const todayDay = today.getDay() - 1; // getDay() returns 0 for Sunday, 1 for Monday, ..., 6 for Saturday
    // Access the specific class schedule using the provided class code
    const classInfo = ClassSchedule[classCode];

    // Check if the class schedule exists
    if (!classInfo) {
      return `Class code ${classCode} is not found in the schedule.`;
    }

    // Search for today's schedule in the class's schedule array
    let todaySchedule = classInfo.schedule.find(
      (schedule) => schedule.day == todayDay
    );

    // Check if the class is scheduled today and return appropriate message
    if (todaySchedule) {
      if (todaySchedule.batch) {
        return `You had ${classInfo.name} scheduled yesterday for ${todaySchedule.batch} from ${todaySchedule.start} to ${todaySchedule.end}.`;
      } else {
        return `You had ${classInfo.name} scheduled yesterday from ${todaySchedule.start} to ${todaySchedule.end}.`;
      }
    } else {
      let next;
      let i = 6;
      while (!todaySchedule && i > 0) {
        next = (Number(todayDay) + i) % 7;
        todaySchedule = classInfo.schedule.find(
          (schedule) => schedule.day == next
        );
        i--;
      }
      if (todaySchedule) {
        if (todaySchedule.batch) {
          return `You didn't have ${classInfo.name} scheduled yesterday.`;
        } else {
          return `You didn't have ${classInfo.name} scheduled yesterday.\n\nYou previously had ${classInfo.name} scheduled on ${dayNames[next]} from ${todaySchedule.start} to ${todaySchedule.end}`;
        }
      } else {
        return "I couldn't find the schedule for the specified subject. \nTry agian by typing subject/faculty name correctly.";
      }
    }
  }

  function isClassSpecificDay(classCode, dayOfWeek) {
    const todayDay = dayOfWeek; // getDay() returns 0 for Sunday, 1 for Monday, ..., 6 for Saturday
    // Access the specific class schedule using the provided class code
    const classInfo = ClassSchedule[classCode];

    // Check if the class schedule exists
    if (!classInfo) {
      return `Class code ${classCode} is not found in the schedule.`;
    }

    // Search for today's schedule in the class's schedule array
    let todaySchedule = classInfo.schedule.find(
      (schedule) => schedule.day == todayDay
    );

    // Check if the class is scheduled today and return appropriate message
    if (todaySchedule) {
      if (todaySchedule.batch) {
        return `${todaySchedule.batch} has ${classInfo.name} scheduled on ${
          dayNames[Number(todayDay)]
        } from ${todaySchedule.start} to ${todaySchedule.end}.`;
      } else {
        return `You have ${classInfo.name} scheduled on ${
          dayNames[Number(todayDay)]
        } from ${todaySchedule.start} to ${todaySchedule.end}.`;
      }
    } else {
      let next;
      let i = 1;
      while (!todaySchedule && i <= 7) {
        next = (Number(todayDay) + i) % 7;
        todaySchedule = classInfo.schedule.find(
          (schedule) => schedule.day == next
        );
        i++;
      }
      if (todaySchedule) {
        if (todaySchedule.batch) {
          return ` You don't have ${classInfo.name} scheduled on ${
            dayNames[Number(todayDay)]
          }.`;
        } else {
          return `You don't have ${classInfo.name} scheduled on ${
            dayNames[Number(todayDay)]
          } .\n\nYou have ${classInfo.name} scheduled on ${
            dayNames[next]
          } from ${todaySchedule.start} to ${todaySchedule.end}`;
        }
      } else {
        return "I couldn't find the schedule for the specified subject. \nTry agian by typing subject/faculty name correctly.";
      }
    }
  }

  function nextSpecificClassToday(classCode) {
    const now = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    const today = new Date(now);
    const todayDay = today.getDay(); // getDay() returns 0 for Sunday, 1 for Monday, ..., 6 for Saturday
    const currentTime = new Date(today).toTimeString().slice(0, 5);
    // Access the specific class schedule using the provided class code
    const classInfo = ClassSchedule[classCode];

    // Check if the class schedule exists
    if (!classInfo) {
      return `Class code ${classCode} is not found in the schedule.`;
    }

    // Search for today's schedule in the class's schedule array
    let todaySchedule = classInfo.schedule.find(
      (schedule) => schedule.day == todayDay && schedule.start > currentTime
    );
    // Check if the class is scheduled today and return appropriate message
    if (todaySchedule) {
      if (todaySchedule.batch) {
        return `Your next ${classInfo.name} is scheduled today for ${todaySchedule.batch} from ${todaySchedule.start} to ${todaySchedule.end}.`;
      } else {
        return `Your next ${classInfo.name} class is scheduled today from ${todaySchedule.start} to ${todaySchedule.end}.`;
      }
    } else {
      let next;
      let i = 1;
      while (!todaySchedule && i <= 7) {
        next = (Number(todayDay) + i) % 7;
        todaySchedule = classInfo.schedule.find(
          (schedule) => schedule.day == next
        );
        i++;
      }
      if (todaySchedule) {
        if (todaySchedule.batch) {
          return `Your next ${classInfo.name} is scheduled on ${dayNames[next]} for ${todaySchedule.batch} from ${todaySchedule.start} to ${todaySchedule.end}.`;
        } else {
          return `Your next ${classInfo.name} class is scheduled on ${dayNames[next]} from ${todaySchedule.start} to ${todaySchedule.end}`;
        }
      } else {
        return "I couldn't find the schedule for the specified subject. \nTry agian by typing subject/faculty name correctly.";
      }
    }
  }

  function previousSpecificClass(classCode) {
    const now = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    const today = new Date(now);
    const todayDay = today.getDay(); // getDay() returns 0 for Sunday, 1 for Monday, ..., 6 for Saturday
    const currentTime = new Date(today).toTimeString().slice(0, 5);
    // Access the specific class schedule using the provided class code
    const classInfo = ClassSchedule[classCode];

    // Check if the class schedule exists
    if (!classInfo) {
      return `Class code ${classCode} is not found in the schedule.`;
    }

    // Search for today's schedule in the class's schedule array
    let todaySchedule = classInfo.schedule.find(
      (schedule) => schedule.day == todayDay && schedule.end < currentTime
    );
    // Check if the class is scheduled today and return appropriate message
    if (todaySchedule) {
      if (todaySchedule.batch) {
        return `Your previous ${classInfo.name} wass scheduled today for ${todaySchedule.batch} from ${todaySchedule.start} to ${todaySchedule.end}.`;
      } else {
        return `Your previous ${classInfo.name} class was scheduled today from ${todaySchedule.start} to ${todaySchedule.end}.`;
      }
    } else {
      let next;
      let i = 6;
      while (!todaySchedule && i > 0) {
        next = (Number(todayDay) + i) % 7;
        todaySchedule = classInfo.schedule.find(
          (schedule) => schedule.day == next
        );
        i--;
      }
      if (todaySchedule) {
        if (todaySchedule.batch) {
          return `Your previous ${classInfo.name} was scheduled on ${dayNames[next]} for ${todaySchedule.batch} from ${todaySchedule.start} to ${todaySchedule.end}.`;
        } else {
          return `Your previous ${classInfo.name} class was scheduled on ${dayNames[next]} from ${todaySchedule.start} to ${todaySchedule.end}`;
        }
      } else {
        return "I couldn't find the schedule for the specified subject. \nTry agian by typing subject/faculty name correctly.";
      }
    }
  }

  function isBatchLabToday(classCode, bno, todayDay) {
    // Access the specific class schedule using the provided class code
    const classInfo = ClassSchedule[classCode];

    // Check if the class schedule exists
    if (!classInfo) {
      return `Class code ${classCode} is not found in the schedule.`;
    }

    // Search for today's schedule in the class's schedule array
    let todaySchedule = classInfo.schedule.find(
      (schedule) => schedule.day == todayDay && schedule.batch == bno
    );
    // Check if the class is scheduled today and return appropriate message
    if (todaySchedule) {
      return `${todaySchedule.batch} has ${classInfo.name} scheduled today from ${todaySchedule.start} to ${todaySchedule.end}.`;
    } else {
      let next;
      let i = 1;
      while (!todaySchedule && i < 7) {
        next = (Number(todayDay) + i) % 7;
        todaySchedule = classInfo.schedule.find(
          (schedule) => schedule.day == next && schedule.batch == bno
        );
        i++;
      }
      if (todaySchedule) {
        return `${todaySchedule.batch} doesn't have ${classInfo.name} scheduled today.\n\n${todaySchedule.batch} has ${classInfo.name} scheduled on ${dayNames[next]} from ${todaySchedule.start} to ${todaySchedule.end}.`;
      } else {
        return "I couldn't find the schedule for the specified subject. \nTry agian by typing subject/faculty name correctly.";
      }
    }
  }

  function isBatchLabTomorrow(classCode, bno, todayDay) {
    // Access the specific class schedule using the provided class code
    const classInfo = ClassSchedule[classCode];

    // Check if the class schedule exists
    if (!classInfo) {
      return `Class code ${classCode} is not found in the schedule.`;
    }

    // Search for today's schedule in the class's schedule array
    let todaySchedule = classInfo.schedule.find(
      (schedule) => schedule.day == todayDay && schedule.batch == bno
    );
    // Check if the class is scheduled today and return appropriate message
    if (todaySchedule) {
      return `${todaySchedule.batch} has ${classInfo.name} scheduled tomorrow from ${todaySchedule.start} to ${todaySchedule.end}.`;
    } else {
      let next;
      let i = 1;
      while (!todaySchedule && i < 7) {
        next = (Number(todayDay) + i) % 7;
        todaySchedule = classInfo.schedule.find(
          (schedule) => schedule.day == next && schedule.batch == bno
        );
        i++;
      }
      if (todaySchedule) {
        return `${todaySchedule.batch} doesn't have ${classInfo.name} scheduled tomorrow.\n\n${todaySchedule.batch} has ${classInfo.name} scheduled on ${dayNames[next]} from ${todaySchedule.start} to ${todaySchedule.end}.`;
      } else {
        return "I couldn't find the schedule for the specified subject. \nTry agian by typing subject/faculty name correctly.";
      }
    }
  }

  function isBatchLabYesterday(classCode, bno, todayDay) {
    // Access the specific class schedule using the provided class code
    const classInfo = ClassSchedule[classCode];

    // Check if the class schedule exists
    if (!classInfo) {
      return `Class code ${classCode} is not found in the schedule.`;
    }

    // Search for today's schedule in the class's schedule array
    let todaySchedule = classInfo.schedule.find(
      (schedule) => schedule.day == todayDay && schedule.batch == bno
    );
    // Check if the class is scheduled today and return appropriate message
    if (todaySchedule) {
      return `${todaySchedule.batch} had ${classInfo.name} scheduled yesterday from ${todaySchedule.start} to ${todaySchedule.end}.`;
    } else {
      let next;
      let i = 6;
      while (!todaySchedule && i > 0) {
        next = (Number(todayDay) + i) % 7;
        todaySchedule = classInfo.schedule.find(
          (schedule) => schedule.day == next && schedule.batch == bno
        );
        i--;
      }
      if (todaySchedule) {
        return `${todaySchedule.batch} didn't have ${classInfo.name} scheduled yesterday.\n\n${todaySchedule.batch} previously had ${classInfo.name} scheduled on ${dayNames[next]} from ${todaySchedule.start} to ${todaySchedule.end}.`;
      } else {
        return "I couldn't find the schedule for the specified subject. \nTry agian by typing subject/faculty name correctly.";
      }
    }
  }

  function isLabSpecificDay(classCode, bno, dayOfWeek) {
    const todayDay = dayOfWeek; // getDay() returns 0 for Sunday, 1 for Monday, ..., 6 for Saturday
    // Access the specific class schedule using the provided class code
    const classInfo = ClassSchedule[classCode];

    // Check if the class schedule exists
    if (!classInfo) {
      return `Class code ${classCode} is not found in the schedule.`;
    }

    // Search for today's schedule in the class's schedule array
    let todaySchedule = classInfo.schedule.find(
      (schedule) => schedule.day == todayDay && schedule.batch == bno
    );

    // Check if the class is scheduled today and return appropriate message
    if (todaySchedule) {
      return `${todaySchedule.batch} has ${classInfo.name} scheduled on ${
        dayNames[Number(todayDay)]
      } from ${todaySchedule.start} to ${todaySchedule.end}.`;
    } else {
      let next;
      let i = 1;
      while (!todaySchedule && i < 7) {
        next = (Number(todayDay) + i) % 7;
        todaySchedule = classInfo.schedule.find(
          (schedule) => schedule.day == next && schedule.batch == bno
        );
        i++;
      }
      if (todaySchedule) {
        return `${todaySchedule.batch} doesn't have ${
          classInfo.name
        } scheduled on ${dayNames[Number(todayDay)]} .\n\n${
          todaySchedule.batch
        } has ${classInfo.name} scheduled on ${dayNames[next]} from ${
          todaySchedule.start
        } to ${todaySchedule.end}`;
      } else {
        return "I couldn't find the schedule for the specified subject. \nTry agian by typing subject/faculty name correctly.";
      }
    }
  }

  function nextSpecificLabToday(classCode, bno) {
    const now = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    const today = new Date(now);
    const todayDay = today.getDay(); // getDay() returns 0 for Sunday, 1 for Monday, ..., 6 for Saturday
    const currentTime = new Date(today).toTimeString().slice(0, 5);
    // Access the specific class schedule using the provided class code
    const classInfo = ClassSchedule[classCode];

    // Check if the class schedule exists
    if (!classInfo) {
      return `Class code ${classCode} is not found in the schedule.`;
    }

    // Search for today's schedule in the class's schedule array
    let todaySchedule = classInfo.schedule.find(
      (schedule) =>
        schedule.day == todayDay &&
        schedule.batch == bno &&
        schedule.start > currentTime
    );
    // Check if the class is scheduled today and return appropriate message
    if (todaySchedule) {
      return `Next ${classInfo.name} for ${todaySchedule.batch} is scheduled today from ${todaySchedule.start} to ${todaySchedule.end}.`;
    } else {
      let next;
      let i = 1;
      while (!todaySchedule && i <= 7) {
        next = (Number(todayDay) + i) % 7;
        todaySchedule = classInfo.schedule.find(
          (schedule) => schedule.day == next && schedule.batch == bno
        );
        i++;
      }
      if (todaySchedule) {
        return `Next ${classInfo.name} for ${todaySchedule.batch} is scheduled on ${dayNames[next]} from ${todaySchedule.start} to ${todaySchedule.end}.`;
      } else {
        return "I couldn't find the schedule for the specified subject. \nTry agian by typing subject/faculty name correctly.";
      }
    }
  }

  function previousSpecificLabToday(classCode, bno) {
    const now = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    const today = new Date(now);
    const todayDay = today.getDay(); // getDay() returns 0 for Sunday, 1 for Monday, ..., 6 for Saturday
    const currentTime = new Date(today).toTimeString().slice(0, 5);
    // Access the specific class schedule using the provided class code
    const classInfo = ClassSchedule[classCode];

    // Check if the class schedule exists
    if (!classInfo) {
      return `Class code ${classCode} is not found in the schedule.`;
    }

    // Search for today's schedule in the class's schedule array
    let todaySchedule = classInfo.schedule.find(
      (schedule) =>
        schedule.day == todayDay &&
        schedule.batch == bno &&
        schedule.end < currentTime
    );
    // Check if the class is scheduled today and return appropriate message
    if (todaySchedule) {
      return `Previously, ${classInfo.name} for ${todaySchedule.batch} was scheduled today from ${todaySchedule.start} to ${todaySchedule.end}.`;
    } else {
      let next;
      let i = 6;
      while (!todaySchedule && i >= 0) {
        next = (Number(todayDay) + i) % 7;
        todaySchedule = classInfo.schedule.find(
          (schedule) => schedule.day == next && schedule.batch == bno
        );
        i--;
      }
      if (todaySchedule) {
        return `Previously, ${classInfo.name} for ${todaySchedule.batch} was scheduled on ${dayNames[next]} from ${todaySchedule.start} to ${todaySchedule.end}.`;
      } else {
        return "I couldn't find the schedule for the specified subject. \nTry agian by typing subject/faculty name correctly.";
      }
    }
  }

  function SpecificLabBatch(classCode, bno) {
    const classInfo = ClassSchedule[classCode];
    // Check if the class schedule exists
    if (!classInfo) {
      return `Class code ${classCode} is not found in the schedule.`;
    }

    // Search for today's schedule in the class's schedule array
    let todaySchedule = classInfo.schedule.find(
      (schedule) => schedule.batch == bno
    );
    // Check if the class is scheduled today and return appropriate message
    if (todaySchedule) {
      return `${todaySchedule.batch} has ${classInfo.name} scheduled on ${
        dayNames[todaySchedule.day]
      } from ${todaySchedule.start} to ${todaySchedule.end}.`;
    } else {
      return "I couldn't find the schedule for the specified subject. \nTry agian by typing subject/faculty name correctly.";
    }
  }

  function getTimeLeft(submissionDate) {
    const date = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });

    // Convert the now string into a Date object
    const now = new Date(date);
    const timeDifference = submissionDate - now;
    const daysLeft = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor(
      (timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutesLeft = Math.floor(
      (timeDifference % (1000 * 60 * 60)) / (1000 * 60)
    );

    if (daysLeft > 0) {
      return `${daysLeft} days, ${hoursLeft} hours, and ${minutesLeft} minutes left\n\n`;
    } else if (hoursLeft > 0) {
      return `${hoursLeft} hours, and ${minutesLeft} minutes left\n\n`;
    } else if (minutesLeft > 0) {
      return `${minutesLeft} minutes left\n\n`;
    } else {
      return "Due Date Has Passed!\n\n";
    }
  }

  // Function to get deadlines for today's submissions
  function getTodaysSubmissions() {
    const date = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });

    // Convert the now string into a Date object
    const now = new Date(date);
    const todayDeadlines = [];
    Object.values(deadlines).forEach((subject) => {
      subject.deadlines.forEach((deadline) => {
        const deadlineDate = deadline.submissionDate;
        // Ensure the submissionDate is not null
        if (deadlineDate) {
          // Compare only the year, month, and date part of the deadline and today
          if (
            deadlineDate.getDate() === now.getDate() &&
            deadlineDate.getMonth() === now.getMonth() &&
            deadlineDate.getFullYear() === now.getFullYear()
          ) {
            todayDeadlines.push({
              description: deadline.description,
              timeLeft: getTimeLeft(deadlineDate),
            });
          }
        }
      });
    });

    // If no deadlines for today, return a message
    if (todayDeadlines.length === 0) {
      return [{ description: "No submissions for today.", timeLeft: "" }];
    }
    return todayDeadlines;
  }

  // Function to get deadlines for tomorrow's submissions
  function getTomorrowsSubmissions() {
    const date = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });

    // Convert the now string into a Date object
    const now = new Date(date);
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1); // Add 1 day to get tomorrow

    const tomorrowDeadlines = [];

    Object.values(deadlines).forEach((subject) => {
      subject.deadlines.forEach((deadline) => {
        const deadlineDate = deadline.submissionDate;

        // Ensure the submissionDate is not null
        if (deadlineDate) {
          // Compare only the year, month, and date part of the deadline and tomorrow
          if (
            deadlineDate.getDate() === tomorrow.getDate() &&
            deadlineDate.getMonth() === tomorrow.getMonth() &&
            deadlineDate.getFullYear() === tomorrow.getFullYear()
          ) {
            tomorrowDeadlines.push({
              description: deadline.description,
              timeLeft: getTimeLeft(deadlineDate),
            });
          }
        }
      });
    });

    // If no deadlines for tomorrow, return a message
    if (tomorrowDeadlines.length === 0) {
      return [{ description: "No submissions for tomorrow.", timeLeft: "" }];
    }

    return tomorrowDeadlines;
  }
  // Function to get all deadlines when no subject is provided
  function getAllDeadlines(deadlineName) {
    const allDeadlines = Object.values(deadlines).flatMap(
      (subject) => subject.deadlines
    );
    const filteredDeadlines = allDeadlines.filter(
      (d) => d.name.toLowerCase() === deadlineName.toLowerCase()
    );

    return filteredDeadlines.map((deadline) => ({
      description: deadline.description,
      timeLeft: getTimeLeft(deadline.submissionDate),
    }));
  }

  // Function to get deadlines for a specific subject
  function getSubjectDeadlines(subjectCode, deadlineName) {
    const subject = deadlines[subjectCode];
    if (subject) {
      const filteredDeadlines = subject.deadlines.filter(
        (d) => d.name.toLowerCase() === deadlineName.toLowerCase()
      );
      return filteredDeadlines.map((deadline) => ({
        description: deadline.description,
        timeLeft: getTimeLeft(deadline.submissionDate),
      }));
    }
    return [];
  }
  
function getNextDeadlines(subjectCode, deadlineName) {
  const date = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });

    // Convert the now string into a Date object
    const now = new Date(date);
  
  let filteredDeadlines = [];

  // Filter deadlines by subject or deadline name if specified
  Object.entries(deadlines).forEach(([code, subject]) => {
    if (!subjectCode || subjectCode === code) {
      subject.deadlines.forEach((deadline) => {
        if (
          (!deadlineName || deadline.name === deadlineName) &&
          deadline.submissionDate > now
        ) {
          filteredDeadlines.push({
            description: deadline.description,
            submissionDate: deadline.submissionDate,
          });
        }
      });
    }
  });

  // Sort deadlines by date
  filteredDeadlines.sort((a, b) => a.submissionDate - b.submissionDate);

  // Group deadlines by unique dates
  const groupedDeadlines = filteredDeadlines.reduce((acc, deadline) => {
    const dateKey = deadline.submissionDate.toISOString().split("T")[0];
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(deadline);
    return acc;
  }, {});

  // Get the next two unique deadline dates
  const nextTwoDates = Object.keys(groupedDeadlines).slice(0, 2);

  // Flatten and format results for the next two dates
  const result = nextTwoDates.flatMap((date) =>
    groupedDeadlines[date].map((deadline) => ({
      description: deadline.description,
      submissionDate: deadline.submissionDate,
    }))
  );

  // If no results found, provide a fallback message and return an empty array
  if (result.length === 0) {
    return []; // Return empty array instead of a string
  }

  return result;
}
  
  if (intentName === "IAMarksAndAttendance") {
    const internal = req.body.queryResult.parameters.internals;

    // Base URL for PDF files
    const baseUrl = process.env.FILES_URL;
    // Array to store PDF paths
    let pdfPaths = [];
    internal.forEach((internals) => {
      // For each subject, handle modules
      if (internals.length === 1 && internals==='marks') {
          pdfPaths.push(
            `${baseUrl}/5th_sem_${internals}.pdf?v=${Date.now()}`
          );
      }else if(internals.length === 1 && internals==='attendance'){
        pdfPaths.push(
            `${baseUrl}/5th_sem_${internals}.pdf?v=${Date.now()}`
          );
      }else{
        pdfPaths.push(
            `${baseUrl}/5th_sem_${internals}.pdf?v=${Date.now()}`
          );
        
      }
    });

    // Prepare the media group payload
    const mediaGroup = pdfPaths.map((pdfPath) => ({
      type: "document",
      media: pdfPath,
    }));
    const docUrl = `https://api.telegram.org/bot${botToken}/sendMediaGroup`;
    try {
      // Send the media group to the user on Telegram
      await axios.post(docUrl, {
        chat_id: chatId,
        media: mediaGroup,
      });
    } catch (error) {
      return res.json({
        fulfillmentText:
          "Sorry, there was an error sending the documents.\n\nPlease check subject name again.",
      });
    }
  }

  if (intentName === "AdminMessage") {
    const message = req.body.queryResult.parameters.message; // Fetch message parameter
    const confirmation = req.body.queryResult.parameters.confirmation; // Fetch confirmation parameter
    if(AdminchatIds.includes(Number(chatId))){
    if (confirmation.toLowerCase() === "yes") {
      Promise.all(
        chatIds.map((chatId) => sendTelegramMessageToMany(chatId, `Message from Admin:\n\n${message}`))
      )
        .then(() => {
         Promise.all(
        AdminchatIds.map((chatId) => sendTelegramMessageToMany(chatId, `For reference:\n\nMessage from Admin ${AdminName[chatId]} to all:\n\n${message}`))
          );
                  sendTelegramMessageToIndividual(chatId,
            "Message has been sent successfully to all recipients."
          );
        })
        .catch((error) => {
          console.error("Error sending messages:", error);
          sendTelegramMessageToIndividual(chatId,
            "There was an error sending the message. Please try again."
          );
        });
    } else {
      sendTelegramMessageToIndividual(chatId,"Message not sent.");
    }}else{
      sendTelegramMessageToIndividual(chatId,"You don't have access.");
    }
  }
  
  if (intentName === "AdminReply"){
    const UserChatId = req.body.queryResult.parameters.chatId; 
    const message = req.body.queryResult.parameters.message; // Fetch message parameter
    const confirmation = req.body.queryResult.parameters.confirmation; // Fetch confirmation parameter
    if(AdminchatIds.includes(Number(chatId))){
    const AdminCID=chatId;
    if (confirmation.toLowerCase() === "yes") {
      let sent=await sendTelegramReply(UserChatId, `Reply from Admin:\n\n${message}`)
      console.log(sent);  
      if(sent===0){
        AdminchatIds.map((chatId) => sendTelegramMessageToMany(chatId, `For reference:\n\nResponse from Admin ${AdminName[AdminCID]} to User ${UserChatId}:\n\n${message}`))
        sendTelegramMessageToIndividual(chatId,
            `Reply has been sent successfully to ${UserChatId}.\n\nReply also Forwarded to all Admins for reference.`
          );
        }else{
          sendTelegramMessageToIndividual(chatId,
            "There was an error sending the message. Please check the User chatId."
        );
        }
    } else {
      sendTelegramMessageToIndividual(chatId,"Message not sent.");
    }
    }else{
      sendTelegramMessageToIndividual(chatId,"You don't have access.");
    }
  }


  if (intentName === "WakeUp") {
    const pingServer = async () => {
      const serverUrl = process.env.NOTIFICATION_SERVER; // Replace with the actual server URL
      let now = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      });

      try {
        // Send a ping request to the server
        await axios.get(serverUrl);
        console.log("Ping sent to Server at:", now);

        // Log success
        const newData = `Success,${now}`;
        console.log("Log Entry:", newData);
        await sendTelegramMessageToIndividual(chatId,"Ping successful!");
      } catch (error) {
        console.error("Error pinging the server:", error.message);

        // Log failure
        const newData = `Failure,${now}`;
        console.log("Log Entry:", newData);
        await sendTelegramMessageToIndividual(chatId,"Failed to ping the server.");
      }
    };
    // Execute and handle response
    pingServer();
  }

  if (intentName === "Deadlines") {
    const subjectCode = req.body.queryResult.parameters.subjects; // Extract subject code from parameters
    const deadlineName = req.body.queryResult.parameters.deadlines; // Extract deadline name from parameters
    const today = req.body.queryResult.parameters.Today;
    const tomorrow = req.body.queryResult.parameters.Tomorrow;
    const next=req.body.queryResult.parameters.Next;
    let responseText = "";
    if (today) {
      let responseText = "Due Today:\n\n";
      let submissions = getTodaysSubmissions();
      if (submissions && submissions.length > 0) {
        responseText += submissions
          .map(
            (submission) =>
              `${submission.description}\n${submission.timeLeft}\n\n`
          )
          .join("\n");
      }
      return res.json({ fulfillmentText: responseText });
    }
    // If 'Tomorrow' parameter is provided, call the 'getTomorrowsDeadline' function
    else if (tomorrow) {
      let responseText = "Due Tomorrow:\n\n";
      let submissions = getTomorrowsSubmissions();
      if (submissions && submissions.length > 0) {
        responseText += submissions
          .map(
            (submission) =>
              `${submission.description}\n${submission.timeLeft}\n\n`
          )
          .join("\n");
      }
      return res.json({ fulfillmentText: responseText });
    }else if (next) {
  let responseText = "Next Deadlines:\n\n";
   let nextDeadlines;   
      if(subjectCode && deadlineName){
  nextDeadlines = getNextDeadlines(subjectCode,deadlineName);
      }else if(subjectCode && !deadlineName){
        nextDeadlines = getNextDeadlines(subjectCode,null);
      }else if(!subjectCode && deadlineName){
        nextDeadlines = getNextDeadlines(null,deadlineName);
      }else{
        nextDeadlines = getNextDeadlines(null,null);
      }

  if (nextDeadlines && nextDeadlines.length > 0) {
    responseText += nextDeadlines
      .map(
        (deadline) =>
          `${deadline.description}\nDeadline: ${deadline.submissionDate.toLocaleString(
            "en-US",
            { timeZone: "Asia/Kolkata" }
          )}\n\n`
      )
      .join("\n");
  } else {
    responseText += "No upcoming deadlines found.";
  }

  return res.json({
    fulfillmentText: responseText.trim(),
  });
}
    // Case 1: When both subject code and deadline are provided
    else if (subjectCode && deadlineName) {
      const subjectDeadlines = getSubjectDeadlines(subjectCode, deadlineName);
      if (subjectDeadlines.length > 0) {
        responseText = subjectDeadlines
          .map((d) => `${d.description}\n${d.timeLeft}`)
          .join("\n");
      } else {
        responseText = `Sorry, no deadline found for ${deadlineName} in ${sub[
          subjectCode
        ].toUpperCase()}.`;
      }
    }

    // Case 2: When no subject code is provided but deadline is specified
    else if (!subjectCode && deadlineName) {
      const allDeadlines = getAllDeadlines(deadlineName);
      if (allDeadlines.length > 0) {
        responseText = allDeadlines
          .map((d) => `${d.description}\n${d.timeLeft}`)
          .join("\n");
      } else {
        responseText = `Sorry, no deadlines found for ${deadlineName}.`;
      }
    }

    // Case 3: When subject code is provided, but deadline is not specified
    else if (subjectCode && !deadlineName) {
      const subject = deadlines[subjectCode];
      if (subject) {
        responseText = subject.deadlines
          .map((d) => `${d.description}\n${getTimeLeft(d.submissionDate)}`)
          .join("\n");
      } else {
        responseText = `Sorry, no subject found with the code ${subjectCode}.`;
      }
    }
    // Case 4: When no parameters are provided (return all deadlines)
    else {
      let responseText = "";
      // Iterate through each subject and its deadlines
      Object.entries(deadlines).forEach(([subjectCode, subject]) => {
        const subjectDeadlines = subject.deadlines
          .map((d) => `${d.description}\n${getTimeLeft(d.submissionDate)}`)
          .join("\n");

        if (subjectDeadlines) {
          responseText += `${subjectDeadlines}\n\n`; // Return subject name and its deadlines
        }
      });

      if (!responseText) {
        responseText = "No deadlines found.";
      }

      return res.json({
        fulfillmentText: responseText.trim(), // Clean up any extra newlines at the end
      });
    }
    // Responding to Dialogflow
    return res.json({
      fulfillmentText: responseText,
    });
  }

  if (intentName === "Study Material") {
    const subjects = req.body.queryResult.parameters.Subjects;
    const modules = req.body.queryResult.parameters.Module; // Assuming 'Module' is now a list

    // Base URL for PDF files
    const baseUrl = process.env.FILES_URL;

    // Array to store PDF paths
    let pdfPaths = [];
    // Loop through each module in the list and create corresponding file paths
    subjects.forEach((subjectCode) => {
      // For each subject, handle modules
      if (modules.length !== 0) {
        // If modules are provided, generate URLs for them
        modules.forEach((module) => {
          pdfPaths.push(
            `${baseUrl}/${sub[subjectCode]}_${module}.pdf?v=${Date.now()}`
          );
        });
      } else {
        // If no modules specified, handle based on subjectCode
        Modules.forEach((module, index) => {
          if (subjectCode === "S5") {
            if (index < 3) {
              pdfPaths.push(
                `${baseUrl}/${sub[subjectCode]}_${module}.pdf?v=${Date.now()}`
              );
            }
          } else {
            // For other subjects, add all modules
            pdfPaths.push(
              `${baseUrl}/${sub[subjectCode]}_${module}.pdf?v=${Date.now()}`
            );
          }
        });
      }
    });

    // Prepare the media group payload
    const mediaGroup = pdfPaths.map((pdfPath) => ({
      type: "document",
      media: pdfPath,
    }));
    const docUrl = `https://api.telegram.org/bot${botToken}/sendMediaGroup`;
    try {
      // Send the media group to the user on Telegram
      await axios.post(docUrl, {
        chat_id: chatId,
        media: mediaGroup,
      });
    } catch (error) {
      return res.json({
        fulfillmentText:
          "Sorry, there was an error sending the study materials.\n\nPlease check subject name again.",
      });
    }
  }

  if (intentName === "Today Specific Class") {
    const subjectCode = req.body.queryResult.parameters.classschedule; // Assuming subjectCode is captured in Dialogflow
    let responseText =
      isClassToday(subjectCode) ||
      "I couldn't find the schedule for the specified subject. \nTry agian by typing subject/faculty name correctly.";
    return res.json({
      fulfillmentText: responseText,
    });
  }

  if (intentName === "Tomorrow Specific Class") {
    const subjectCode = req.body.queryResult.parameters.classschedule; // Assuming subjectCode is captured in Dialogflow
    let responseText =
      isClassTomorrow(subjectCode) ||
      "I couldn't find the schedule for the specified subject. \nTry agian by typing subject/faculty name correctly.";
    return res.json({
      fulfillmentText: responseText,
    });
  }

  if (intentName === "Yesterday Specific Class") {
    const subjectCode = req.body.queryResult.parameters.classschedule; // Assuming subjectCode is captured in Dialogflow
    let responseText =
      wasClassYesterday(subjectCode) ||
      "I couldn't find the schedule for the specified subject. \nTry agian by typing subject/faculty name correctly.";
    return res.json({
      fulfillmentText: responseText,
    });
  }

  if (intentName === "Specific Class") {
    const subjectCode = req.body.queryResult.parameters.classschedule; // Assuming subjectCode is captured in Dialogflow
    const dayParameter = req.body.queryResult.parameters.day;
    dayOfWeek = dayParameter;
    let responseText =
      isClassSpecificDay(subjectCode, dayOfWeek) ||
      "I couldn't find the schedule for the specified subject. \nTry agian by typing subject/faculty name correctly.";
    return res.json({
      fulfillmentText: responseText,
    });
  }

  if (intentName === "Next Specific Class") {
    const subjectCode = req.body.queryResult.parameters.classschedule; // Assuming subjectCode is captured in Dialogflow
    let responseText =
      nextSpecificClassToday(subjectCode) ||
      "I couldn't find the schedule for the specified subject. \nTry agian by typing subject/faculty name correctly.";
    return res.json({
      fulfillmentText: responseText,
    });
  }

  if (intentName === "Previous Specific Class") {
    const subjectCode = req.body.queryResult.parameters.classschedule; // Assuming subjectCode is captured in Dialogflow
    let responseText =
      previousSpecificClass(subjectCode) ||
      "I couldn't find the schedule for the specified subject. \nTry agian by typing subject/faculty name correctly.";
    return res.json({
      fulfillmentText: responseText,
    });
  }

  if (intentName === "Batch Wise Lab") {
    const subjectCode = req.body.queryResult.parameters.classschedule; // Assuming subjectCode is captured in Dialogflow
    const batch = req.body.queryResult.parameters.batch;
    const today = req.body.queryResult.parameters.today;
    const tomorrow = req.body.queryResult.parameters.tomorrow;
    const yesterday = req.body.queryResult.parameters.yesterday;
    const next = req.body.queryResult.parameters.next;
    const previous = req.body.queryResult.parameters.previous;
    const specific = req.body.queryResult.parameters.day;
    const now = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    const date = new Date(now);
    const Day = date.getDay(); // getDay() returns 0 for Sunday, 1 for Monday, ..., 6 for Saturday
    let responseText;
    if (today) {
      responseText =
        isBatchLabToday(subjectCode, batch, Day) ||
        "I couldn't find the schedule for the specified subject. \nTry agian by typing subject/faculty name correctly.";
    } else if (tomorrow) {
      responseText =
        isBatchLabTomorrow(subjectCode, batch, (Day + 1) % 7) ||
        "I couldn't find the schedule for the specified subject. \nTry agian by typing subject/faculty name correctly.";
    } else if (yesterday) {
      responseText =
        isBatchLabYesterday(subjectCode, batch, (Day + 6) % 7) ||
        "I couldn't find the schedule for the specified subject. \nTry agian by typing subject/faculty name correctly.";
    } else if (next) {
      responseText =
        nextSpecificLabToday(subjectCode, batch) ||
        "I couldn't find the schedule for the specified subject. \nTry agian by typing subject/faculty name correctly.";
    } else if (previous) {
      responseText =
        previousSpecificLabToday(subjectCode, batch) ||
        "I couldn't find the schedule for the specified subject. \nTry agian by typing subject/faculty name correctly.";
    } else if (specific) {
      responseText =
        isLabSpecificDay(subjectCode, batch, specific) ||
        "I couldn't find the schedule for the specified subject. \nTry agian by typing subject/faculty name correctly.";
    } else {
      responseText =
        SpecificLabBatch(subjectCode, batch) ||
        "I couldn't find the schedule for the specified subject. \nTry agian by typing subject/faculty name correctly.";
    }
    return res.json({
      fulfillmentText: responseText,
    });
  }

  if (intentName === "ClassSchedule") {
    const subjectCode = req.body.queryResult.parameters.classschedule; // Assuming subjectCode is captured in Dialogflow
    const subjectSchedule = ClassSchedule[subjectCode] || null;
    let responseText =
      "I couldn't find the schedule for the specified subject. \nTry agian by typing subject/faculty name correctly.";

    if (subjectSchedule) {
      responseText = `Here's the schedule for ${subjectSchedule.name}:\n`;

      subjectSchedule.schedule.forEach(({ day, start, end, batch }) => {
        const dayName = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ][day];
        if (batch) {
          responseText += `${dayName}: ${start} to ${end} (${batch}),\n`;
        } else {
          responseText += `${dayName}: ${start} to ${end},\n`;
        }
      });
    }

    return res.json({
      fulfillmentText: responseText,
    });
  }

  if (intentName === "Current Class") {
    const options = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    };
    const today = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    const currentDay = new Date(today).getDay();
    const currentTime = new Date(today).toTimeString().slice(0, 5);

    const todayClasses = classDurations[currentDay] || [];
    let currentClass = "No class is scheduled at this time.";
    for (const { start, end, subject } of todayClasses) {
      if (currentTime >= start && currentTime < end) {
        currentClass = `Your current class is \n${subject} from ${start} to ${end}.`;
        break;
      }
      // Check for breaks and lunch
      else if (
        currentTime >= "10:50" &&
        currentTime < "11:05" &&
        currentDay >= 1 &&
        currentDay <= 6
      ) {
        currentClass = "It's break time!";
      } else if (
        currentTime >= "12:55" &&
        currentTime < "13:40" &&
        currentDay >= 1 &&
        currentDay <= 5
      ) {
        currentClass = "It's lunch break!";
      }
    }

    return res.json({
      fulfillmentText: currentClass,
    });
  }

  if (intentName === "Next Class") {
    const options = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    };
    const today = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    const currentDay = new Date(today).getDay(); // Correctly accounts for timezone
    const currentTime = new Date(today).toTimeString().slice(0, 5);

    const todaySchedule = weeklySchedule[currentDay] || [];
    let nextClass = null;

    // Find the next class for today
    for (const { time, subject } of todaySchedule) {
      if (time > currentTime) {
        nextClass = `Your next class is \n${subject} at ${time}.`;
        break;
      }
    }

    // If no more classes today, find the next class on another day
    if (!nextClass) {
      for (let i = 1; i <= 6; i++) {
        // Loop through the next 6 days
        const nextDay = (currentDay + i) % 7;
        const nextDaySchedule = weeklySchedule[nextDay] || [];
        if (nextDaySchedule.length > 0) {
          const { time, subject } = nextDaySchedule[0];
          const days = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ];
          nextClass = `No more classes today. \nYour next class is on \n${days[nextDay]} at ${time} for ${subject}.`;
          break;
        }
      }
    }

    return res.json({
      fulfillmentText:
        nextClass || "It seems there are no upcoming classes scheduled.",
    });
  }

  if (intentName === "Previous Class") {
    const options = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    };
    const today = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    const currentDay = new Date(today).getDay(); // Correctly accounts for timezone
    const currentTime = new Date(today).toTimeString().slice(0, 5);

    const todaySchedule = classDurations[currentDay] || [];
    let previousClass = null;

    // Find the next class for today
    for (const { start, end, subject } of todaySchedule) {
      while (end < currentTime) {
        previousClass = `Your previous class was \n${subject} from ${start} to ${end}.`;
        break;
      }
    }

    // If no more classes today, find the next class on another day
    if (!previousClass) {
      for (let i = 6; i >= 1; i--) {
        // Loop through the next 6 days
        const previousDay = (Number(currentDay) + i) % 7;
        const previousDaySchedule = classDurations[previousDay] || [];
        if (previousDaySchedule.length > 0) {
          const { start, end, subject } =
            previousDaySchedule[previousDaySchedule.length - 1];
          const days = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ];
          previousClass = `\nYour previous class was ${subject} \n on ${days[previousDay]} from ${start} to ${end}.`;
          break;
        }
      }
    }

    return res.json({
      fulfillmentText:
        previousClass || "It seems there were no previous classes scheduled.",
    });
  }

  if (intentName === "Faculty") {
    // Get the subject parameter (e.g., S1, S2, etc.)
    const subjectCode = req.body.queryResult.parameters.Subjects;

    // Find the faculty name for the specified subject
    const facultyResponse =
      facultyNames[subjectCode] ||
      "ANN (22SAL051) - Mr. Mahesh Kumar, \nOS (22SAL052) - Mrs. Varsha, \nCN (22SAL053) - Mrs. Thanmayee, \nDAA (22SAL054) - Ms. Swarna, \nDS (22SAL553) - Ms. Veeda.";

    return res.json({
      fulfillmentText: `${facultyResponse}`,
    });
  }

  // Handle the "Exams" intent
  if (intentName === "Exams") {
    // Get the subject parameter (e.g., E1, E2, etc.)
    const subjectCode = req.body.queryResult.parameters.Exams;
    let examResponse = "";
    const next = req.body.queryResult.parameters.Next;
    const previous = req.body.queryResult.parameters.previous;

    if (next) {
      const { nextExams, nextExamTime } = findNextExams(); // Modified function to handle multiple overlapping exams

      if (nextExams.length > 0) {
        // If nextExams has multiple exams, handle all of them
        examResponse = `Upcoming Exam(s) on ${nextExamTime.toLocaleDateString(
          "en-GB"
        )}:\n\n`;

        nextExams.forEach(({ exam }) => {
          if (exam === "E6" || exam === "E7") {
            // For lab exams E6 and E7, display batch details
            const startTime = examDates[exam][0];
            const endTime = new Date(
              examDates[exam][6].getTime() + 3 * 60 * 60 * 1000
            ); // Last batch + 3 hours

            let batchDetails = `-----------------------------------------------------------------------\n\nLab Exam: ${
              exam === "E6" ? "Operating System" : "DAA"
            }\n`;
            batchDetails += `Overall Start: ${startTime.toLocaleString(
              "en-GB"
            )}\nOverall End: ${endTime.toLocaleString(
              "en-GB"
            )}\n\nBatch Timings:\n`;

            examDates[exam].forEach((batchDate, index) => {
              const timeLeft = calculateTimeLeft(batchDate);
              batchDetails += `Batch ${
                index + 1
              }:\nStart: ${batchDate.toLocaleString(
                "en-GB"
              )}\nTime Left: ${timeLeft}\n\n`;
            });

            examResponse += batchDetails;
          } else {
            // For single-date exams, display exam time and countdown
            const timeLeft = calculateTimeLeft(nextExamTime);
            examResponse += `Upcoming Exam: ${
              Subject[exam]
            }\nDate: ${nextExamTime.toLocaleDateString(
              "en-GB"
            )}\nTime Left: ${timeLeft}\n\n`;
          }
        });
      } else {
        examResponse = "There are no upcoming exams.";
      }
    } else if (subjectCode === "E6" || subjectCode === "E7") {
      // Loop through batches for multi-date exams (E6, E7)
      let react = "";
      for (let i = 0; i < 7; i++) {
        const timeLeft = calculateTimeLeft(examDates[subjectCode][i]);
        react += `${exams[subjectCode][i]}\n${timeLeft}\n\n`;
      }

      examResponse =
        subjectCode === "E6"
          ? `Operating System \nLab Exam- \n\n${react}`
          : `Design and Analysis of Algorithms \nLab Exam- \n\n${react}`;
    } else if (["E1", "E2", "E3", "E4", "E5"].includes(subjectCode)) {
      // Single-date exams (E1 to E5)
      const timeLeft = calculateTimeLeft(examDates[subjectCode]);
      examResponse = `${exams[subjectCode]}\n\n${timeLeft}`;
    } else {
      // General response for all exams
      examResponse = `Theory Exams - \n\n20/11/2024 - OS, \n22/11/2024 - ANN, \n25/11/2024 - CN, \n27/11/2024 - DAA, \n29/11/2024 - DS,\n\n\nLab Exams - \n\n7/11/2024 to 9/11/2024 - OS, \n9/11/2024 to 12/11/2024 - DAA`;
    }

    return res.json({
      fulfillmentText: examResponse,
    });
  }

  // Get the day parameter from the request (assuming it's passed in)
  const dayParameter = req.body.queryResult.parameters.day;
  const PeriodNo = req.body.queryResult.parameters.period;

  // Handle schedule intents
  intentHandler: {
    if (intentName === "Today's Schedule") {
      const today = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      });
      const indiaDate = new Date(today); // Convert the localized string back to Date object
      dayOfWeek = indiaDate.getDay(); // Get the day of the week (0 = Sunday, 1 = Monday, etc.)
    } else if (intentName === "Tomorrow's Schedule") {
      const today = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      });
      const indiaToday = new Date(today); // Convert to Date object based on India's timezone
      const tomorrow = new Date(indiaToday);
      dayOfWeek = (tomorrow.getDay() + 1) % 7; // Get day of the week for tomorrow
    } else if (intentName === "Yesterday's schedule") {
      const today = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      });
      const indiaToday = new Date(today); // Convert to Date object based on India's timezone
      const yesterday = new Date(indiaToday);
      dayOfWeek = (yesterday.getDay() + 6) % 7; // Get day of the week for yesterday
    } else if (intentName === "Schedule by Day") {
      dayOfWeek = dayParameter; // Use the day parameter directly
    } else if (intentName === "SpecificPeriod") {
      dayOfWeek = dayParameter; // Use the day parameter directly
    } else if (intentName === "Today'sPeriod") {
      const today = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      });
      const indiaDate = new Date(today); // Convert the localized string back to Date object
      dayOfWeek = indiaDate.getDay(); // Get the day of the week (0 = Sunday, 1 = Monday, etc.)
    } else if (intentName === "Tomorrow'sPeriod") {
      const today = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      });
      const indiaDate = new Date(today); // Convert the localized string back to Date object
      const tomorrow = new Date(indiaDate);
      dayOfWeek = (tomorrow.getDay() + 1) % 7; // Get the day of the week (0 = Sunday, 1 = Monday, etc.)
    } else if (intentName === "Yesterday'sPeriod") {
      const today = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      });
      const indiaDate = new Date(today); // Convert the localized string back to Date object
      const yesterday = new Date(indiaDate);
      dayOfWeek = (yesterday.getDay() + 6) % 7; // Get the day of the week (0 = Sunday, 1 = Monday, etc.)
    } else if (intentName === "Default Fallback Intent") {
      // Ask if user wants to contact Class Representative
      const followUp =
        "I'm sorry, I can't answer that. \nWould you like to ask your Class Representative about this? \n(Yes/No)";

      // Store the user's query in an output context
      const userQuery = req.body.queryResult.queryText;

      return res.json({
        fulfillmentText: followUp,
        outputContexts: [
          {
            name: `${req.body.session}/contexts/user-query-context`, // Store user query context
            lifespanCount: 1,
            parameters: {
              queryText: userQuery,
            },
          },
        ],
        payload: {
          expectUserResponse: true,
        },
      });
    } else if (intentName === "Ask Class Representative Intent") {
      // Extract user information
      const userName = req.body.queryResult.parameters.userName;
      const userMsg = req.body.queryResult.parameters.userMsg; //
      const confirmation=req.body.queryResult.parameters.confirmation;

      // Retrieve the user query from the context
      const userQueryContext = req.body.queryResult.outputContexts.find(
        (context) => context.name.includes("user-query-context")
      );

      const userQuery = userQueryContext
        ? userQueryContext.parameters.queryText
        : "No query provided";
      // Forward the query to Class Representative
      if (confirmation.toLowerCase() === "yes") {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER, // Your email
          to: process.env.CR_EMAIL, // Change to CR email
          subject: `Query from ${userName}`,
          text: `User Query: ${userQuery}\nUser Message: ${userMsg}\n\nUser ChatID:${chatId}`,
        });

        const message = `Query from ${userName}:\nUser Query: ${userQuery}\nUser Message: ${userMsg}\n\nUser ChatID:${chatId}`;
        await AdminchatIds.map((chatId) =>
          sendTelegramMessageToMany(chatId, message)
        );

        return res.json({
          fulfillmentText: `${userName}, your query "${userQuery}" and message "${userMsg}" have been forwarded to the Class Representative.`,
        });
      } catch (error) {
        console.error("Error sending email:", error);
        return res.json({
          fulfillmentText:
            "There was an error sending your query. Please try again later.",
        });
      }
      }else{
        return res.json({
          fulfillmentText:
            "Message not sent.",
        });
      }
    }
  }
  if (intentName === "Contact CR") {
    // Extract user information
    const userName = req.body.queryResult.parameters.userName;
    const userMsg = req.body.queryResult.parameters.userMsg; 
    const confirmation=req.body.queryResult.parameters.confirmation;
    if (confirmation.toLowerCase() === "yes") {

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER, // Your email
        to: process.env.CR_EMAIL, // Change to CR email
        subject: `Message from ${userName}`,
        text: `User Message: ${userMsg}\n\nUser ChatID:${chatId}`,
      });

      const message = `Message from ${userName}:\nUser Message: ${userMsg}\n\nUser ChatID:${chatId}`;
      await AdminchatIds.map((chatId) =>
        sendTelegramMessageToMany(chatId, message)
      );

      return res.json({
        fulfillmentText: `${userName}, your message "${userMsg}" has been forwarded to the Class Representative.`,
      });
    } catch (error) {
      console.error("Error sending email:", error);
      return res.json({
        fulfillmentText:
          "There was an error sending your query. Please try again later.",
      });
    }
    }else{
            return res.json({
        fulfillmentText:
          "Message not sent.",
      });
    }
  }

  // Validate the dayOfWeek for schedule intents
  if (
    intentName !== "Default Fallback Intent" &&
    intentName !== "Ask Class Representative Intent"
  ) {
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return res.json({
        fulfillmentText: "Please provide a valid day of the week.",
      });
    }
    // Get the appropriate schedule response
    const scheduleResponse =
      schedules[dayOfWeek] || "No classes for the selected day.";
    let timing = "";
    if (dayNames[dayOfWeek] !== "Sunday") {
      const classTiming = classDurations[dayOfWeek];
      const firstPeriodStart = classTiming[0].start;
      const lastPeriodEnd = classTiming[classTiming.length - 1].end;
      timing = `Classes start at ${firstPeriodStart} and end at ${lastPeriodEnd}`;
    }
    // Send back the response based on the intent
    let responseText;
    if (intentName === "Today's Schedule") {
      responseText = `Today's schedule is: ${scheduleResponse}\n\n${timing}`;
    } else if (intentName === "Tomorrow's Schedule") {
      responseText = `Tomorrow's schedule is: ${scheduleResponse}\n\n${timing}`;
    } else if (intentName === "Yesterday's schedule") {
      responseText = `Yesterday's schedule was: ${scheduleResponse}\n\n${timing}`;
    } else if (intentName === "Schedule by Day") {
      const dayName = dayNames[dayOfWeek]; // Get the corresponding day name
      responseText = `The schedule for ${dayName} is: ${scheduleResponse}\n\n${timing}`;
    } else if (intentName === "SpecificPeriod") {
      const dayName = dayNames[dayOfWeek];
      let Time;
      if (PeriodNo == 8) {
        Time = Period[PeriodNo][dayOfWeek - 1];
      } else {
        Time = Period[PeriodNo];
      }

      const periodInfo = getPeriodDetails(dayOfWeek, Time); // Get the corresponding day name
      if (PeriodNo == 8) {
        responseText = `Last Hour, on ${dayName} is ${periodInfo}`;
      } else {
        responseText = `Hour - ${PeriodNo} on ${dayName} is ${periodInfo}`;
      }
    } else if (intentName === "Today'sPeriod") {
      const dayName = dayNames[dayOfWeek];
      let Time;
      if (PeriodNo == 8) {
        Time = Period[PeriodNo][dayOfWeek - 1];
      } else {
        Time = Period[PeriodNo];
      }

      const periodInfo = getPeriodDetails(dayOfWeek, Time); // Get the corresponding day name
      if (PeriodNo == 8) {
        responseText = `Today's Last Hour is \n${periodInfo}`;
      } else {
        responseText = `Today, Hour - ${PeriodNo} is \n${periodInfo}`;
      }
    } else if (intentName === "Tomorrow'sPeriod") {
      const dayName = dayNames[dayOfWeek];
      let Time;
      if (PeriodNo == 8) {
        Time = Period[PeriodNo][dayOfWeek - 1];
      } else {
        Time = Period[PeriodNo];
      }

      const periodInfo = getPeriodDetails(dayOfWeek, Time); // Get the corresponding day name
      if (PeriodNo == 8) {
        responseText = `Tomorrow's Last Class is \n${periodInfo}`;
      } else {
        responseText = `Tomorrow, Hour - ${PeriodNo} is \n${periodInfo}`;
      }
    } else if (intentName === "Yesterday'sPeriod") {
      const dayName = dayNames[dayOfWeek];
      let Time;
      if (PeriodNo == 8) {
        Time = Period[PeriodNo][dayOfWeek - 1];
      } else {
        Time = Period[PeriodNo];
      }

      const periodInfo = getPeriodDetails(dayOfWeek, Time); // Get the corresponding day name
      if (PeriodNo == 8) {
        responseText = `Yesterday's Last Class was \n${periodInfo}`;
      } else {
        responseText = `Yesterday, Hour - ${PeriodNo} was \n${periodInfo}`;
      }
    } else if (intentName === "Timetable") {
      responseText = `Timetable\n\nMonday${schedules[1]}\n\nTuesday${schedules[2]}\n\nWednesday${schedules[3]}\n\nThursday${schedules[4]}\n\nFriday${schedules[5]}\n\nSaturday${schedules[6]}`;
    }

    res.json({
      fulfillmentText: responseText,
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
