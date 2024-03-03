document.addEventListener('DOMContentLoaded', () => {
    const maxNumber = 75;
    const drawResults = getDataFromLocalStorage('drawResults');
    const bingoCardsData = getDataFromLocalStorage('bingoCardsData');
    const indicatorText = getDataFromLocalStorage('drawIndicator');
    const select = (selector) => document.querySelector(selector);

    console.log(drawResults);

    const playerCountDrp = select('[data-player-count]');
    const generateCardBtn = select('[data-generate-cards]');
    const rollBtn = select('[data-generate-random]');
    const playAgainBtn = select('[data-play-again]');
    const cancelBtn = select('[data-cancel]');
    const resultIndicator = select('[data-result]');
    const winnerIndicator = select('[data-winner]');
    const cardContainer = select('.card-container');
    const winnerDialog = select('dialog');
    const winnerCardContainer = select('#winner-container');
    const aside = select('aside');

    initPlayerOption();
    initResultTable();
    restoreInitialState();

    generateCardBtn.addEventListener('click', () => {
        emptyLocalStorage();
        
        Array.from(aside.querySelectorAll('tr')).forEach(cell => Object.assign
            (cell.style, { backgroundColor: 'rgba(0, 0, 0, 0)', color: 'black' }));
        
        // moves the cursor back to the top of the table
        scrollToDrawResult('b1');
        rollBtn.disabled = false;
        drawResults.length = 0;

        const winnerCount = checkForWinner();
        const hasCards = cardContainer.querySelector('div');
        const winnerIndicatorText = winnerIndicator.textContent;

        if (!winnerCount && hasCards && !window.confirm("Re-shuffle cards?")) return;

        winnerIndicator.textContent = winnerIndicatorText.slice(0, -1) + "0";

        const quantity = playerCountDrp.value;

        if (quantity) generateCardData(quantity);
        else {
            alert('Select a value first');
            cardContainer.innerHTML = '';
        }
    });


    // generates result
    rollBtn.addEventListener('click', () => {
        markPreviousResults();

        const hasCards = cardContainer.querySelector('div');

        if (hasCards) {
            if (drawResults.length !== maxNumber) {
                let drawResult;

                do {
                    drawResult = generateResult();
                } while (drawResults.includes(drawResult));

                scrollToDrawResult(drawResult);
                markDrawResult(drawResult, "#50C878");
                drawResults.push(drawResult);
                resultIndicator.value = `Under ${capitalizeFirstLetter(drawResult)}`;

                saveToLocalStorage('drawIndicator', resultIndicator.value);

                if (drawResults.length === maxNumber) {
                    alert('Max attempt reached!');
                    rollBtn.disabled = true;
                }

                const winningCardIds = checkForWinner();
                if (winningCardIds) displayWinner(winningCardIds);

                saveToLocalStorage('drawResults', drawResults);
            } else {
                alert('Max attempt reached!');
                rollBtn.disabled = true;
            }

            console.log(drawResults);
        } else {
            alert('Generate cards first');
        }
    });

    // reloads page
    playAgainBtn.addEventListener('click', () => {
        emptyLocalStorage();
        location.reload();
    });

    cancelBtn.addEventListener('click', () => {
        winnerDialog.close();
    })
    

    function restoreInitialState(){
        const latestDraw = drawResults[drawResults.length - 1];
        if(bingoCardsData.length > 0){
            bingoCardsData.forEach(cardData => {
                const card = generateCardHTML(cardData);
                cardContainer.innerHTML += card;
            })
        }
        markPreviousResults();
        markDrawResult(latestDraw, '#50C878');
        scrollToDrawResult(latestDraw);
        resultIndicator.value = indicatorText;

    }

    function emptyLocalStorage(){
        localStorage.clear();
    }

    function markPreviousResults(){
        if (drawResults.length > 0) {
            drawResults.forEach(result => markDrawResult(result, "#c4c400"));
        }
    }

    function getDataFromLocalStorage(key) {
        const storedCardsData = localStorage.getItem(key);
        return storedCardsData ? JSON.parse(storedCardsData) : [];
    }

    // initializes result log table
    function initResultTable() {
        var newTable = document.createElement('table');
        for (let i = 1; i <= 75; i++) {
            const tableRow = document.createElement('tr');
            const letter = i <= 15 ? 'B' :
                        i <= 30 ? 'I' : 
                        i <= 45 ? 'N' : 
                        i <= 60 ? 'G' : 
                        i <= 75 ? 'O' : 
                        null;
                        
            if(letter) {
                tableRow.classList.add(`${letter.toLowerCase()}${i}`);
                tableRow.innerHTML = `<td>${letter}</td> <td>${i}</td>`;
                newTable.append(tableRow);
            }
        }
        aside.append(newTable);
    }

    // initializes drop down menu for players
    function initPlayerOption() {
        for (let i = 0; i < 100; i++) {
            const playerQty = document.createElement('option');
            playerQty.value = i + 1;
            playerQty.textContent = i + 1;
            playerCountDrp.appendChild(playerQty);
        }
    }

    // generates bingo cards
    function generateCardData(quantity) {
        cardContainer.innerHTML = '';
        const quantityInt = parseInt(quantity);
        const cardsData = []
        const letter = ['b', 'i', 'n', 'g', 'o']

        for (let i = 0; i < quantityInt; i++) {
            const cardNumbers = generateBingoNumbers();
            const cardData = {
                id: `card${i + 1}`,
                player: `Player${i + 1}`,
                numbers: []
            }

            for(let x = 0; x < 5; x++){
                if(x === 0){
                    for(let y = 0; y < 5; y++){
                        cardData.numbers.push({content: letter[y].toUpperCase(), class: 'free'});
                    }
                }

                for(let y = 0; y < 5; y++){
                    const isCenterCell = x === 2 && y ===2;
                    const cellContent = isCenterCell ? 'Free' : cardNumbers[x][y];
                    const cellClass = isCenterCell ? 'free' : `${letter[y]}${cardNumbers[x][y]}`;

                    cardData.numbers.push({content: cellContent, class: cellClass});
                }
            }

            cardsData.push(cardData);
        }

        // saves the cards data to the localstorage
        saveToLocalStorage('bingoCardsData', cardsData);
        
        // renders the cards data to html object
        cardsData.forEach(cardData => {
            const cardHTML = generateCardHTML(cardData);
            cardContainer.innerHTML += cardHTML;
        });
    }

    function generateCardHTML(cardData){
        const {id, player, numbers} = cardData;
        var card = `<div class="card" id="${id}">`;
        card += `<h1> ${player} </h1>`;
        card += `<table>`;

        for(let x = 0; x < 6; x++){
            card += '<tr>';
            for(let y = 0; y < 5; y++){
                const {content, class: cellClass} = numbers[x * 5 + y];
                card += `<td class="${cellClass}">${content}</td>`;
            }
            card += '</tr>';
        }
        
        card += '</table> </div>';

        return card;
    }

    function saveToLocalStorage(key, value){
        localStorage.setItem(key, JSON.stringify(value));
    }

    // checks each cell for winner
    function checkForWinner() {
        const cards = cardContainer.querySelectorAll('.card');
        const winnerIds = [];

        for (const card of cards) {
            const cells = card.querySelectorAll('td');
            let blackOut = true;

            for (const cell of cells) {
                const backgroundColor = getComputedStyle(cell).backgroundColor;
                if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
                    blackOut = false;
                    break;
                }
            }

            if (blackOut) {
                winnerIds.push(card.id)
            }
        }

        return winnerIds.length > 0 ? winnerIds : null;
    }
    
    // displays winning card in dialog
    function displayWinner(cardIds) {
        const winners = cardIds.length;
        winnerIndicator.textContent = winnerIndicator.textContent.slice(0, -1) + winners;

        rollBtn.disabled = true;
        cardIds.forEach(cardId => {
            const winningCard = cardContainer.querySelector(`#${cardId}`);
            const clonedCard = winningCard.cloneNode(true);
            winnerCardContainer.append(clonedCard);
            winnerDialog.showModal();
        });
    }

    // generates bingo numbers
    function generateBingoNumbers() {
        const rows = 5;
        const cols = 5;
        const cardNumbers = [];

        let i = 0;
        while (i < cols) {
            const column = [];
            let j = 0;

            while (j < rows) {
                const min = i * 15 + 1;
                const max = (i + 1) * 15;
                const randomNum = getRandomInt(min, max);

                if (!column.includes(randomNum)) {
                    column.push(randomNum);
                    j++;
                }
            }

            cardNumbers.push(column);
            i++;
        }

        const transposedCardNumbers = Array.from({ length: rows }, (_, rowIndex) =>
            cardNumbers.map(column => column[rowIndex])
        );

        return transposedCardNumbers;
    }

    // generates draw results
    function generateResult() {
        const maxNumber = 75;
        const randomNum = getRandomInt(1, maxNumber);
        
        return (
            (randomNum >= 1 && randomNum <= 15) ? `b${randomNum}` :
            (randomNum >= 16 && randomNum <= 30) ? `i${randomNum}` :
            (randomNum >= 31 && randomNum <= 45) ? `n${randomNum}` :
            (randomNum >= 46 && randomNum <= 60) ? `g${randomNum}` :
            (randomNum >= 61 && randomNum <= 75) ? `o${randomNum}` :
            null
        );
    }

    // generates random number from min to max
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function markDrawResult(className, bgcolor) {
        const selectedCells = document.getElementsByClassName(className);
        const textColor = "#FbFcF8"
        for (const cell of selectedCells) {
            cell.style.backgroundColor = bgcolor;
            cell.style.color = textColor;
        }
    }

    function scrollToDrawResult(drawResult) {
        [...aside.getElementsByClassName(drawResult)].forEach(element => {
            element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            element.style.border = '3px solid';
        });
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
})