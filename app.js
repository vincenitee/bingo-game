document.addEventListener('DOMContentLoaded', () => {
    const maxNumber = 75;
    const drawResults = [];
    const select = (selector) => document.querySelector(selector);

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

    generateCardBtn.addEventListener('click', () => {
        Array.from(aside.querySelectorAll('tr')).forEach(cell => Object.assign(cell.style, { backgroundColor: 'rgba(0, 0, 0, 0)', color: 'black' }));
        scrollToDrawResult('b1');
        rollBtn.disabled = false;
        drawResults.length = 0;

        const winnerCount = checkForWinner();
        const hasCards = cardContainer.querySelector('div');
        const winnerIndicatorText = winnerIndicator.textContent;

        if (!winnerCount && hasCards && !window.confirm("Re-shuffle cards?")) return;

        winnerIndicator.textContent = winnerIndicatorText.slice(0, -1) + "0";

        const quantity = playerCountDrp.value;

        if (quantity) generateCards(quantity);
        else {
            alert('Select a value first');
            cardContainer.innerHTML = '';
        }
    });


    // generates result
    rollBtn.addEventListener('click', () => {
        if (drawResults.length > 0) {
            drawResults.forEach(result => markDrawResult(result, "#c4c400"));
        }

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

                if (drawResults.length === maxNumber) {
                    alert('Max attempt reached!');
                    rollBtn.disabled = true;
                }

                const winningCardIds = checkForWinner();
                if (winningCardIds) displayWinner(winningCardIds);
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
        location.reload();
    });

    cancelBtn.addEventListener('click', () => {
        winnerDialog.close();
    })
    
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
    function generateCards(quantity) {
        cardContainer.innerHTML = '';
        var quantity = parseInt(quantity);
        var card = '';
        const letter = ['b', 'i', 'n', 'g', 'o']

        for (let i = 0; i < quantity; i++) {
            var cardNumbers = generateBingoNumbers();
            card += `<div class="card" id="card${i + 1}">`;
            card += `<h1>Player ${i + 1}</h1>`;
            card += `<table>`;

            for (let x = 0; x < 6; x++) {
                card += '<tr>';

                for (let y = 0; y < 5; y++) {
                    if (x === 0) {
                        card += `<td class="free">${letter[y].toUpperCase()}</td>`;
                    } else {
                        const isCenterCell = x === 3 && y === 2; // Center row for "Free"
                        const cellContent = isCenterCell ? 'Free' : cardNumbers[x - 1][y];
                        const cellClass = isCenterCell ? 'free' : `${letter[y]}${cardNumbers[x - 1][y]}`;

                        card += `<td class="${cellClass}">${cellContent}</td>`;
                    }
                }

                card += '</tr>';
            }


            card += '</table> </div>';
            cardContainer.innerHTML = card;
        }

    }

    function saveBingoCard(cardData){
        
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