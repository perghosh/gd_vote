(function(){
    let eBanner = document.getElementById("idBanner");

    // style banner
    let sStyle = "background-color: rgb(47, 47, 47); color: rgb(255, 255, 255); font-family: Roboto, sans-serif; font-size: 14px; font-weight: 600; margin-bottom: 5px; padding: 7px;";
    eBanner.style.cssText = sStyle;
    let sHtml = `
<div class="container" style="text-align: right;">
   <a href="https://knapptryckarna.se" style="color: inherit; padding: 1px 14px;">Knapptryckarna</a>
   <a href="https://knapptryckarna.se/ge-en-gava/" style="color: inherit; padding: 1px 14px;">Ge en gåva</a>
   <a href="https://knapptryckarna.se/bli-medlem/" style="color: inherit; padding: 1px 14px;">Bli medlem</a>
</div>   
    `;

   eBanner.innerHTML = sHtml;    
})();