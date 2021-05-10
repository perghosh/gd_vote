Genomgång om vad som ligger framför oss
==

Eller, vad i helvete håller Per på med???

Testgrupp
--
Testgrupp för att testa funktioner.  
Exempel vad testgrupp är viktigt för:
- Registrering av användare
  - Att registrera användare är lätt men registrering kräver en hel del utöver att bara registrera.
  - Användare måste kunna radera sin profil. 
  - Radera alla sina röster
  - Om användare glömt av lösenord, det behöver hanteras
  - Skall vi ha säkra inloggningar, också ett område som måste skötas (freja)
  - Om användare skall kunna skriva kommentarer, skall då användaren kunna redigera sin kommentar?
  - Vi skall ha ett passande gränssnitt (utseende), ALLA har åsikter om utseende
- Omröstningar
  - Skall användare kunna ändra sin röst om man råkat rösta fel? Tar tid att lägga in logik för det
  - Hur komplexa omröstningar skall vi kunna ha
  - Skall systemet gå att sälja för att säkra ekonomi, då räcker det inte med JA/NEJ röster. 
  - Omröstningar med flera frågor, där användare inte måste rösta på allt eller om det skall gå att välja flera.
- Statistik
  - Vad för typ av statistik skall användaren ha möjlighet att se.
  - Exempelvis Patriks exempel med Sverigekarta, det tar tid att lägga in den typen av statistik. Kanske två månaders jobb för en programmerare och sedan skall det testas, det är dessutom anvancerad programmering.
  - Enklare statistik behövs, statistik är mycket viktigt för att det skall bli intressant att rösta.
  - Kan vi inte presentera resultat så det tydligt framgår samt är trovärdigt vad folket vill kan systemet heller inte bli politiskt starkt.
- Version, vi skall ha flera versioner.
- Administration
  - Systemet behöver administreras. Adminstration är ingen liten del och skall systemet säljas behöver denna del också vara användarvänlig.



Serverbelastning
--
Många som röstar måste vara ett mål?
- Får vi inte många som röstar kommer det här inte fungera.
  - Får vi många som röstar är det självklart bra, men det innebär också en hel del tekniska problem. Systemet måste klara hög belastning.
  - Klarar inte systemet hög belastning och vi lagt ner 6 månaders utveckling med väljare som "hoppas"... Då ligger snaran nära. Den situationen vill inte jag vara med om.
  - Därför är det viktigt att vi NU försöker testa belastning, vad systemet klarar.
  - Känner vi oss säkra med hög belastning, det kräver ändå jobb för att hantera databaser och systemet kan inte längre "stängas av", små jobb kan bli stora jobb för det kräver planering.
  - Serverbelastning kan inte en testgrupp testgrupp klara, där behöver vi live testning.

Ekonomi
--
Ovanstående punkter kräver tid, det finns mer och räkna inte med att allt går på räls.
- Orimligt att tro att någon (några) skall lösa ovanstående utan ekonomisk ersättning. Man behöver leva
  - Har vi ett fungerande system så är det säkert lätt att också skaffa finansering.
  - Har vi inte ett fungerande system, inte lika lätt...


Anpassa sig efter situationen
--
Utveckla mjukvara är ett stort risktagande och det är svårt, väldigt svårt. Många misslyckas.
- Kan man inte programmera så förstår man inte ovanstående, det här är ett dilemma för de flesta som kodar. Konsulter älskar det, de kan locka oändligt mycket pengar av okunniga kunder men vi kan det inte.
- Som läget är nu är det bara jag som förstår vad som ligger framför oss vilket är naturligt, det är jag som sitter med kunskapen i att programmera.
- För mig är det mycket viktigt att "säkra" upp för framtida problem. Det får inte hända att man spenderat 6 månader på något och så fungerar det inte, ingen gör det.
- Min prioritet nu är att stressa systemet (få många som röstar) och lösa tekniska problem för att systemet skall bli komersiellt intressant, ekonomin.
- Lyckas vi att lösa en del tekniska problem, få trovärdighet är jag helt övertygad om att systemet går att sälja. Gör vi det inte så kollapsar projeket.



