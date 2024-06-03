window.addEventListener("load",  function(){


    //----------- preluare date cos virtual (din localStorage)
    // in localStorage vom memora cosul virtual ca o lista de id-uri separate prin virgula
    // "cos_virtual": "3,1,10,4,2"
    // daca vreau si cantitate: "3|2,5|1,1|7" prajitura 3 (2 bucati), prajitura 5(1 bucata)...

    let iduriProduse=localStorage.getItem("cos_virtual");
    iduriProduse=iduriProduse?iduriProduse.split(","):[];      //["3","1","10","4","2"]
    /*
        [value=3].select-cos{
            color:red;
        }

    */
    for(let idp of iduriProduse){
        let ch = document.querySelector(`[value='${idp}'].select-cos`);
        if(ch){
            ch.checked=true;
        }
        else{
            console.log("id cos virtual inexistent:", idp);
        }
    }

    //----------- adaugare date in cosul virtual (din localStorage)
    let checkboxuri= document.getElementsByClassName("select-cos");
    for(let ch of checkboxuri){
        ch.onchange=function(){
            let iduriProduse=localStorage.getItem("cos_virtual");
            iduriProduse=iduriProduse?iduriProduse.split(","):[];

            if( this.checked){
                iduriProduse.push(this.value)
            }
            else{
                let poz= iduriProduse.indexOf(this.value);
                if(poz != -1){
                    iduriProduse.splice(poz,1);
                }
            }

            localStorage.setItem("cos_virtual", iduriProduse.join(","))
        }
        
    }
})
