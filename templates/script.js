const countButton = document.querySelector("#count_button");
const countSpan =  document.querySelector("#count_span");
let count = 0;

function incrementer() {
    count++;
    countSpan.textContent = count;
}

countButton.addEventListener("click",()=>{
    incrementer()
})