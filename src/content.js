import { ics } from 'exports-loader?exports=ics!./ics.min.js';

const SEM_STARTS = {
   "1244": "2024-01-23", // Spring
   "1246": "2024-06-17", // Summer
   "1252": "2024-09-04", // Fall
};
const SEM_ENDS = {
   "1244": "2024-05-03",
   "1246": "2024-08-11",
   "1252": "2024-12-11"
};

const button = '\
<div id="schedule-download" class="d-flex">\
   <style>\
      #schedule-download {\
         color: var(--white);\
         border-radius: 10px 10px 10px 10px;\
         align-items: center;\
         padding-left: 12px;\
         &:hover {\
            cursor: pointer;\
            background-color: rgba(0, 0, 0, 0.2);\
         }\
      }\
   </style>\
   <div class="fs-5">\
      Download Schedule\
   </div>\
   <button class="btn fs-3" style="color: var(--white);" aria-expanded="false" type="button">\
      <i class="bi-download fs-3"></i>\
   </button>\
</div>';

var header = document.getElementById("header-buttons");
header.insertAdjacentHTML('afterbegin', button);

document.getElementById("schedule-download").addEventListener("click", function () {
   const scripts = document.head.getElementsByTagName("script");

   var data;
   for (const script of scripts) {
      var text = script.text;
      const START = 'const data = ';
      var start_ind = text.indexOf(START) + START.length;
      if (start_ind !== -1 + START.length) {
         var end_ind = text.indexOf(';', start_ind);
         data = JSON.parse(text.substring(start_ind, end_ind));
         break;
      }
   }

   const SEMESTER_START = SEM_STARTS[data.termCode];
   const SEMESTER_END = SEM_ENDS[data.termCode];

   console.log(data);
   var cal = ics();

   // Add Classes
   for (const even of data.events) {
      // Get the class info
      const subject = even.title;
      const description = data.courseForClassId[even.id].title;
      // Get class
      var clas;
      for (clas of data.classes) {
         if (clas.id === even.id) {
            break;
         }
      }
      // Get location, if we can
      // The data they give us is missing things, so make sure the day is right
      const date = new Date(even.start);
      const DAYS = ['X', 'M', 'T', 'W', 'R', 'F', 'X'];
      const day = DAYS[date.getDay()];
      var location = "Unknown";
      for (const meeting of clas.meetings) {
         if (meeting.dayInitials.includes(day)) {
            location = meeting.location;
            break;
         }
      }
      // Start and end
      var begin = new Date(SEMESTER_START + even.start.substring(10));
      var end = new Date(SEMESTER_START + even.end.substring(10));
      // Daylight savings :((
      function isDST(d) {
         let jan = new Date(d.getFullYear(), 0, 1).getTimezoneOffset();
         let jul = new Date(d.getFullYear(), 6, 1).getTimezoneOffset();
         return Math.max(jan, jul) !== d.getTimezoneOffset();
      }
      if (isDST(begin)) {
         begin.setHours(begin.getHours() - 1);
         end.setHours(end.getHours() - 1);
      }
      // Get days of week right
      const sem_start_day = new Date(SEMESTER_START + "T12:00:00-06:00").getDay();
      if (date.getDay() < sem_start_day) {
         begin.setDate(begin.getDate() + 7 + date.getDay() - sem_start_day);
         end.setDate(end.getDate() + 7 + date.getDay() - sem_start_day);
      } else {
         begin.setDate(begin.getDate() + date.getDay() - sem_start_day);
         end.setDate(end.getDate() + date.getDay() - sem_start_day);
      }
      // Repeat
      const ICAL_DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
      const ical_day = ICAL_DAYS[date.getDay()];

      const rrule = {
         freq: 'WEEKLY',
         until: SEMESTER_END + "T23:59:59-06:00",
         byday: [ical_day],
      }

      cal.addEvent(subject, description, location, begin, end, rrule);
   }

   // Add Exams
   for (const course of data.courses) {
      for (const exam of course.exams) {
         // Begin and End
         const begin = exam.start;
         const end = exam.end;
         // Subject and Description
         const subject = course.subjectShortDesc + " " + course.catalogNumber + " Final";
         const description = course.title + " Final";
         // Location
         const location = exam.online ? "Online" : exam.location;

         cal.addEvent(subject, description, location, begin, end);
      }
   }

   // Download
   (async () => {
      let url = URL.createObjectURL(new Blob([cal.build()], { type: 'text/calendar' }));
      await chrome.runtime.sendMessage(url);
   })();
});