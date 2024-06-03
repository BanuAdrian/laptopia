window.addEventListener("load",function(){

	prod_sel=localStorage.getItem("cos_virtual");

	if (prod_sel){
		var vect_ids=prod_sel.split(",");
		fetch("/produse_cos", {		

			method: "POST",
			headers:{'Content-Type': 'application/json'},
			
			mode: 'cors',		
			cache: 'default',
			body: JSON.stringify({
				a:10,
				b:20,

				ids_prod: vect_ids

			})
		})
		.then(function(rasp){ console.log(rasp); x=rasp.json(); console.log(x); return x})
		.then(function(objson) {
	
			console.log(objson);//objson e vectorul de produse
			let main=document.getElementsByTagName("main")[0];
			let btn=document.getElementById("cumpara");

			for (let prod of objson){
				let article=document.createElement("article");
				article.classList.add("cos-virtual");
				var h2=document.createElement("h2");
				h2.innerHTML=prod.nume;
				article.appendChild(h2);
				let imagine=document.createElement("img");
				imagine.src="/resurse/imagini/produse/"+prod.imagine;
				article.appendChild(imagine);
				
				let descriere=document.createElement("p");
				descriere.innerHTML=prod.descriere+" <b>Pret:</b>"+prod.pret;
				article.appendChild(descriere);
				main.insertBefore(article, btn);
				

			}
	
		}
		).catch(function(err){console.log(err)});




		document.getElementById("cumpara").onclick=function(){
			prod_sel=localStorage.getItem("cos_virtual");// "1,2,3"
			if (prod_sel){
				var vect_ids=prod_sel.split(",");
				fetch("/cumpara", {		
		
					method: "POST",
					headers:{'Content-Type': 'application/json'},
					
					mode: 'cors',		
					cache: 'default',
					body: JSON.stringify({
						ids_prod: vect_ids,
						a:10,
						b:"abc"
					})
				})
				.then(function(rasp){ console.log(rasp); return rasp.text()})
				.then(function(raspunsText) {
			
					console.log(raspunsText);
					if(raspunsText){
						localStorage.removeItem("cos_virtual")
						let p=document.createElement("p");
						p.innerHTML=raspunsText;
						document.getElementsByTagName("main")[0].innerHTML="";
						document.getElementsByTagName("main")[0].appendChild(p)
					}
				}).catch(function(err){console.log(err)});
			}
		}
		
	}
	else{
		document.getElementsByTagName("main")[0].innerHTML="<p>Nu aveti nimic in cos!</p>";
	}
	
	
});