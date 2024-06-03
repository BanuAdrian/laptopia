window.addEventListener("DOMContentLoaded", function(){
    let p=this.document.createElement("p");
    p.innerHTML=new Date() +"(generat prin factura.js)";
    this.document.body.appendChild(p);
})