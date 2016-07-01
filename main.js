/*jslint plusplus: true, browser: true, devel: true */
/*global Papa, longCSVDataToShort, Handlebars, $, addInteraction*/

//This is to set up handlebars below
var collegeListTemplate,
   fileListTemplate;

/******************************************************************/
/****************** LONG CSV DATA TO SHORT ************************/
/******************************************************************/

var longCSVDataToShort = function (rawData) {
   "use strict";

   function sortByName(a, b) {
      if (a.name < b.name) {
         return -1;
      }

      if (a.name > b.name) {
         return 1;
      }
      return 0;
   }

   var colleges = {},
      departments = [],
      changed;

   /************* CONVERT *******************/
   //we pass in an empty array to the reduce at the bottom 
   changed = rawData.reduce(function (arrayOut, file) {
      var collIndex, deptIndex;

      //trim all the parts
      Object.keys(file).forEach(function (key) {
         file[key] = file[key].trim();
      });


      // check college on index list and add it
      if (colleges[file.college] === undefined) {
         colleges[file.college] = arrayOut.length;
         //make sure they get a place holder
         departments.push({});

         //make the college obj
         arrayOut.push({
            name: file.college,
            departments: []
         });
      }

      //will use a buch so save it for easy access
      collIndex = colleges[file.college];

      //check department is on the index list
      if (departments[collIndex][file.department] === undefined) {
         //put on list
         departments[collIndex][file.department] = arrayOut[collIndex].departments.length;
         //in array out
         arrayOut[collIndex].departments.push({
            name: file.department,
            files: []
         });
      }

      //it's clearer this way
      deptIndex = departments[collIndex][file.department];

      //put it in
      arrayOut[collIndex].departments[deptIndex].files.push({
         name: file.name,
         url: file.url
      });

      return arrayOut;

   }, []);

   /******** SORT ********/

   //sort colleges
   changed.sort(sortByName);

   //sort departments
   changed.forEach(function (college) {
      college.departments.sort(sortByName);

      //sort files
      college.departments.forEach(function (department) {
         department.files.sort(sortByName);
      });
   });

   /********* PRINT *********/
   /*console.dir(changed, {
   depth: null
});*/

   return changed;
};

/******************************************************************/
/*********************** INTERACTION LOGIC ************************/
/******************************************************************/

function toggle_visibility(idIn) {
   "use strict";


   $('#fileList > div').each(function () {
      var firstPicSrc;

      //change the showing of it
      if (this.id === idIn) {
         this.style.display = 'block';
         firstPicSrc = $("#" + this.id + " img").attr("data-src");

         //put in the previews
         $(window.top.document.body).find("#zoomPic img").attr("src", firstPicSrc).show();
         $("#preview img").attr("src", firstPicSrc);
         $("#preview").show();

      } else {
         this.style.display = 'none';
      }
   });

}


function addInteraction() {
   "use strict";
   var outer = $(window.top.document.body);

   //make the zoom pic
   $('<div id="zoomPic" style="display:none; position: fixed; top:50px; width:100%; z-index:100; background: gray;"><img style="max-width: 60%; margin:15px auto; display:block;" src="" ></div>').appendTo(outer);

   //change src on img click
   $("#fileList img").click(function () {
      //outer then inner
      outer.find("#zoomPic img").attr("src", this.src);
      $("#preview img").attr("src", this.src);
   });

   //set up the close buttons 
   $('.righter').click(function () {
      this.parentElement.style.display = 'none';

      //outer then inner
      outer.find("#zoomPic img").hide();
      $("#preview img").attr("src", "none.png");
      $("#preview").hide();
   });

   //set up the collegeList clicks
   $('#collegeList li').click(function () {
      var number = this.id.match(/\d+/)[0];
      toggle_visibility('college' + number);
   });


   //do the scrolly magic
   $(window.top.document).on("scroll", function (e) {
      //console.dir(this.scrollingElement.scrollTop);
      if (this.scrollingElement.scrollTop > 600) {
         //console.log("stick");
         outer.find('#zoomPic').show();
      } else {
         //console.log("un stick");
         outer.find('#zoomPic').hide();
      }

   });
}




/******************************************************************/
/************************* TEMPLATES ******************************/
/******************************************************************/

//gets called after the csv is fetched with Papa with ajax
function runTemplates(csv) {
   "use strict";
   //conver the obj and put array in to obj to make it work with Handlebars #each;
   var colleges = {
      colleges: longCSVDataToShort(csv.data)
   };

   //use the templates
   $("#collegeList").html(collegeListTemplate(colleges));
   $("#fileList").html(fileListTemplate(colleges));
}


/******************************************************************/
/*************************** START ********************************/
/******************************************************************/

//do this when we are ready
$(function () {
   "use strict";
   //get the templates
   $.get("templates.txt", function (templateString) {
      //set up handlebars
      templateString = templateString.split(/^\|+$/m);
      collegeListTemplate = Handlebars.compile(templateString[0]);
      fileListTemplate = Handlebars.compile(templateString[1]);

      $.get("info.csv", function (csvText) {
         //have to run our own ajax because Papa does not trim the last line
         var csv = Papa.parse(csvText.trim(), {
            header: true
         });
         runTemplates(csv);
         addInteraction();
      });
   });
});
