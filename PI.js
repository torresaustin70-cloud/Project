let Fullname ="bro";
let age = 300;
let student = true;

let students = 30
students += 1;

let result = 7+16;
console.log(result);

console.log(students);
console.log(student);
console.log(Fullname);
console.log(age);
//document.getElementById("D2").textContent = `Your name is ${fullname}`;
//document.getElementById("D3").textContent = `Your are ${age} years old`;

//on the fun button page
/*let username;

document.getElementById("mySubmit").onclick = function(){ 
    username = document.getElementById("Mytext").value;
    document.getElementById("D1").textContent = `Hello${username}`    
};
*/
//Const is variable that can't be change
//remenber use diffent qutoes in textConent

//why doesnt this work?
//figure it work. Must sperated

const PI= 3.14159;
let radius;
let circumference;

document.getElementById("MySubmit2").onclick = function(){
   radius = document.getElementById("Mytext2").value;
   radius = Number(radius);
    circumference = 2*PI*radius;
    document.getElementById("D4").textContent = circumference + "cm";
};
