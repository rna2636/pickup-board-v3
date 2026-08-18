// ==========================================================
// Pickup Board v3.2
// app.js 전체 코드
// ==========================================================


// ==========================================================
// 기본 설정
// ==========================================================

const MAX_VISIBLE_ORDERS = 6;
const STORAGE_KEY = "pickupBoardV3State";

// 예상 대기시간 계산 기준
// 새우류 전체 2개당 5분
// 회오리감자 전체 1개당 1분
const SHRIMP_BATCH_SIZE = 2;
const SHRIMP_BATCH_MINUTES = 5;
const POTATO_MINUTES = 1;


// ==========================================================
// 메뉴 정보
// ==========================================================

const MENU_INFO = {
    chiliShrimp: {
        name: "칠리새우",
        icon: "🌶️"
    },

    creamShrimp: {
        name: "크림새우",
        icon: "🍤"
    },

    tornadoPotato: {
        name: "회오리감자",
        icon: "🍟"
    }
};


// ==========================================================
// 현재 입력 중인 주문
// ==========================================================

const currentOrder = {
    chiliShrimp: 0,
    creamShrimp: 0,
    tornadoPotato: 0
};


// ==========================================================
// 주문 및 영업 데이터
// ==========================================================

// 현재 주문
let orders = [];

// 호출 중인 주문
let calledOrders = [];

// 오늘 누적 판매량
let dailySales = {
    chiliShrimp: 0,
    creamShrimp: 0,
    tornadoPotato: 0
};

// 현재 재고량
let stock = {
    chiliShrimp: 0,
    creamShrimp: 0,
    tornadoPotato: 0
};

// 내부 주문 식별번호
let internalOrderId = 1;


// ==========================================================
// HTML 요소
// ==========================================================

const orderNumberInput =
    document.getElementById("orderNumber");

const numericKeypadModal =
    document.getElementById("numericKeypadModal");

const numericKeypadTitle =
    document.getElementById("numericKeypadTitle");

const numericKeypadValueText =
    document.getElementById("numericKeypadValue");

const numericKeypadConfirmButton =
    document.getElementById("numericKeypadConfirm");

let nextOrderNumber = 1;

let activeKeypadState = null;

const registerButton =
    document.getElementById("registerButton");


// 메뉴 수량 표시

const chiliCountText =
    document.getElementById("countChili");

const creamCountText =
    document.getElementById("countCream");

const potatoCountText =
    document.getElementById("countPotato");


// + 버튼

const plusChiliButton =
    document.getElementById("plusChili");

const plusCreamButton =
    document.getElementById("plusCream");

const plusPotatoButton =
    document.getElementById("plusPotato");


// - 버튼

const minusChiliButton =
    document.getElementById("minusChili");

const minusCreamButton =
    document.getElementById("minusCream");

const minusPotatoButton =
    document.getElementById("minusPotato");


// 메뉴 이름

const chiliMenuName =
    plusChiliButton
        ?.closest(".menu-item")
        ?.querySelector(".menu-name");

const creamMenuName =
    plusCreamButton
        ?.closest(".menu-item")
        ?.querySelector(".menu-name");

const potatoMenuName =
    plusPotatoButton
        ?.closest(".menu-item")
        ?.querySelector(".menu-name");


// 현재 주문

const currentOrdersContainer =
    document.getElementById("currentOrders");

const waitingCountText =
    document.getElementById("waitingCount");

const hiddenOrderCountText =
    document.getElementById("hiddenOrderCount");

const summaryChili =
    document.getElementById("summaryChili");

const summaryCream =
    document.getElementById("summaryCream");

const summaryPotato =
    document.getElementById("summaryPotato");


// 번호 호출

const calledOrdersContainer =
    document.getElementById("calledOrders");

const recallButton =
    document.getElementById("recallButton");


// 현재 현황

const estimatedTime =
    document.getElementById("estimatedTime");

const waitingOrdersText =
    document.getElementById("waitingOrders");

const salesChili =
    document.getElementById("salesChili");

const salesCream =
    document.getElementById("salesCream");

const salesPotato =
    document.getElementById("salesPotato");

const stockChili =
    document.getElementById("stockChili");

const stockCream =
    document.getElementById("stockCream");

const stockPotato =
    document.getElementById("stockPotato");

const resetButton =
    document.getElementById("resetButton");

const closeButton =
    document.getElementById("closeButton");


// ==========================================================
// 메뉴 UI 연결 정보
// ==========================================================

const MENU_CONTROLS = {
    chiliShrimp: {
        plusButton: plusChiliButton,
        minusButton: minusChiliButton,
        countText: chiliCountText,
        menuName: chiliMenuName
    },

    creamShrimp: {
        plusButton: plusCreamButton,
        minusButton: minusCreamButton,
        countText: creamCountText,
        menuName: creamMenuName
    },

    tornadoPotato: {
        plusButton: plusPotatoButton,
        minusButton: minusPotatoButton,
        countText: potatoCountText,
        menuName: potatoMenuName
    }
};


// ==========================================================
// 숫자 데이터 보정
// ==========================================================

function getSafeNonNegativeNumber(value) {
    const number = Number(value);

    if (
        !Number.isFinite(number) ||
        number < 0
    ) {
        return 0;
    }

    return Math.floor(number);
}


function repairMenuData(data) {
    return {
        chiliShrimp:
            getSafeNonNegativeNumber(
                data?.chiliShrimp
            ),

        creamShrimp:
            getSafeNonNegativeNumber(
                data?.creamShrimp
            ),

        tornadoPotato:
            getSafeNonNegativeNumber(
                data?.tornadoPotato
            )
    };
}


// ==========================================================
// 데이터 저장
// ==========================================================

function saveState() {
    const state = {
        orders,
        calledOrders,
        dailySales,
        stock,
        internalOrderId,

        nextOrderNumber:
            getSafeNextOrderNumber(nextOrderNumber)
    };

    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(state)
        );
    } catch (error) {
        console.error(
            "데이터를 저장하지 못했습니다.",
            error
        );
    }
}


// ==========================================================
// 저장 데이터 불러오기
// ==========================================================

function loadState() {
    try {
        const savedState =
            localStorage.getItem(STORAGE_KEY);

        if (!savedState) {
            return false;
        }

        const parsedState =
            JSON.parse(savedState);

        orders =
            Array.isArray(parsedState.orders)
                ? parsedState.orders
                : [];

        calledOrders =
            Array.isArray(parsedState.calledOrders)
                ? parsedState.calledOrders
                : [];

        dailySales =
            repairMenuData(
                parsedState.dailySales
            );

        stock =
            repairMenuData(
                parsedState.stock
            );

        internalOrderId =
            Number.isInteger(
                parsedState.internalOrderId
            )
                ? parsedState.internalOrderId
                : 1;

        nextOrderNumber =
            getSafeNextOrderNumber(
                parsedState.nextOrderNumber
            );

        updateOrderNumberDisplay();

        repairLoadedOrders();

        return true;
    } catch (error) {
        console.error(
            "저장 데이터를 불러오지 못했습니다.",
            error
        );

        return false;
    }
}


// ==========================================================
// 저장된 주문 데이터 보정
// ==========================================================

function repairLoadedOrders() {
    const allOrders = [
        ...orders,
        ...calledOrders
    ];

    const now = Date.now();

    allOrders.forEach(function (order) {
        order.id =
            Number(order.id) || 0;

        order.number =
            Number(order.number) || 0;

        order.chiliShrimp =
            getSafeNonNegativeNumber(
                order.chiliShrimp
            );

        order.creamShrimp =
            getSafeNonNegativeNumber(
                order.creamShrimp
            );

        order.tornadoPotato =
            getSafeNonNegativeNumber(
                order.tornadoPotato
            );

        if (
            typeof order.createdAt !== "number" ||
            !Number.isFinite(order.createdAt)
        ) {
            order.createdAt = now;
        }

        if (
            order.status !== "waiting" &&
            order.status !== "cooking" &&
            order.status !== "called"
        ) {
            order.status = "waiting";
        }

        if (
            order.status === "cooking" &&
            (
                typeof order.cookingStartedAt !== "number" ||
                !Number.isFinite(order.cookingStartedAt)
            )
        ) {
            order.cookingStartedAt = now;
        }
    });

    const highestId =
        allOrders.reduce(
            function (highest, order) {
                return Math.max(
                    highest,
                    order.id
                );
            },
            0
        );

    if (internalOrderId <= highestId) {
        internalOrderId =
            highestId + 1;
    }
}


// ==========================================================
// 메뉴 수량 화면 갱신
// ==========================================================

function renderCurrentOrderCounts() {
    chiliCountText.textContent =
        currentOrder.chiliShrimp;

    creamCountText.textContent =
        currentOrder.creamShrimp;

    potatoCountText.textContent =
        currentOrder.tornadoPotato;
}


function getSafeNextOrderNumber(value) {
    const parsedValue = Number(value);

    if (
        !Number.isInteger(parsedValue) ||
        parsedValue < 1 ||
        parsedValue > 9999
    ) {
        return 1;
    }

    return parsedValue;
}


function updateOrderNumberDisplay() {
    if (orderNumberInput) {
        orderNumberInput.textContent =
            String(nextOrderNumber);
    }
}


function updateNumericKeypadDisplay() {
    if (!numericKeypadValueText || !activeKeypadState) {
        return;
    }

    numericKeypadValueText.textContent =
        activeKeypadState.draft || "0";
}


function openNumericKeypad(mode, menuKey = null) {
    if (!numericKeypadModal) {
        return;
    }

    if (mode === "orderNumber") {
        activeKeypadState = {
            mode: "orderNumber",
            menuKey: null,
            draft: String(nextOrderNumber),
            replaceOnNextDigit: true
        };

        if (numericKeypadTitle) {
            numericKeypadTitle.textContent =
                "주문번호 수정";
        }
    } else if (mode === "stock") {
        activeKeypadState = {
            mode: "stock",
            menuKey,
            draft: String(stock[menuKey]),
            replaceOnNextDigit: true
        };

        if (numericKeypadTitle) {
            const menuName = MENU_INFO[menuKey]?.name || "재고";
            numericKeypadTitle.textContent =
                `${menuName} 재고 수정`;
        }
    } else {
        return;
    }

    updateNumericKeypadDisplay();

    numericKeypadModal.hidden = false;
    numericKeypadModal.classList.add("is-open");
    orderNumberInput.setAttribute(
        "aria-expanded",
        "true"
    );
}


function closeNumericKeypad() {
    if (!numericKeypadModal) {
        return;
    }

    numericKeypadModal.hidden = true;
    numericKeypadModal.classList.remove("is-open");
    activeKeypadState = null;

    if (orderNumberInput) {
        orderNumberInput.setAttribute(
            "aria-expanded",
            "false"
        );
    }
}


function handleDigitInput(digit) {
    if (!activeKeypadState) {
        return;
    }

    const nextDigit = String(digit);

    if (activeKeypadState.draft.length >= 4) {
        return;
    }

    if (activeKeypadState.replaceOnNextDigit) {
        activeKeypadState.draft = nextDigit;
        activeKeypadState.replaceOnNextDigit = false;
    } else {
        if (
            activeKeypadState.draft === "0" &&
            nextDigit !== "0"
        ) {
            activeKeypadState.draft = nextDigit;
        } else {
            activeKeypadState.draft += nextDigit;
        }
    }

    updateNumericKeypadDisplay();
}


function handleBackspace() {
    if (!activeKeypadState) {
        return;
    }

    activeKeypadState.replaceOnNextDigit = false;

    if (activeKeypadState.draft.length <= 1) {
        activeKeypadState.draft = "0";
    } else {
        activeKeypadState.draft =
            activeKeypadState.draft.slice(0, -1);
    }

    updateNumericKeypadDisplay();
}


function applyNumericKeypadValue() {
    if (!activeKeypadState) {
        return;
    }

    const trimmedDraft =
        String(activeKeypadState.draft).trim();

    if (activeKeypadState.mode === "orderNumber") {
        if (
            trimmedDraft === "" ||
            trimmedDraft === "0" ||
            !/^[1-9]\d{0,3}$/.test(trimmedDraft)
        ) {
            alert(
                "주문번호는 1~9999 사이의 정수만 사용할 수 있습니다."
            );

            return;
        }

        const parsedValue =
            Number.parseInt(trimmedDraft, 10);

        if (
            !Number.isInteger(parsedValue) ||
            parsedValue < 1 ||
            parsedValue > 9999
        ) {
            alert(
                "주문번호는 1~9999 사이의 정수만 사용할 수 있습니다."
            );

            return;
        }

        nextOrderNumber = parsedValue;
        updateOrderNumberDisplay();
        saveState();
        closeNumericKeypad();

        return;
    }

    if (activeKeypadState.mode === "stock") {
        const parsedValue =
            Number.parseInt(trimmedDraft, 10);

        if (
            !Number.isInteger(parsedValue) ||
            parsedValue < 0 ||
            parsedValue > 9999
        ) {
            alert(
                "재고량은 0 이상 9999 이하의 정수만 사용할 수 있습니다."
            );

            return;
        }

        stock[activeKeypadState.menuKey] =
            parsedValue;

        saveState();
        renderStatus();
        closeNumericKeypad();
    }
}


// ==========================================================
// 품절 및 수량 버튼 상태 갱신
// ==========================================================

function updateMenuControls() {
    Object.entries(
        MENU_CONTROLS
    ).forEach(function (
        [menuKey, controls]
    ) {
        const availableStock =
            stock[menuKey];

        const selectedQuantity =
            currentOrder[menuKey];

        const soldOut =
            availableStock <= 0;

        // 재고보다 많이 선택되어 있으면 재고량까지 줄임
        if (
            selectedQuantity >
            availableStock
        ) {
            currentOrder[menuKey] =
                availableStock;
        }

        // 재고 0이면 수량을 0으로 초기화
        if (soldOut) {
            currentOrder[menuKey] = 0;
        }

        // + 버튼
        controls.plusButton.disabled =
            soldOut ||
            currentOrder[menuKey] >=
                availableStock;

        controls.plusButton.classList.toggle(
            "sold-out-button",
            soldOut
        );

        // - 버튼

         if (soldOut) {

         controls.minusButton.disabled = true;
         controls.minusButton.style.visibility = "visible";

} else {

         controls.minusButton.disabled =
         currentOrder[menuKey] <= 0;

         controls.minusButton.style.visibility =
         currentOrder[menuKey] <= 0
            ? "hidden"
            : "visible";
}

         controls.minusButton.classList.toggle(
    "sold-out-button",
    soldOut
);

        // 메뉴 이름
        if (controls.menuName) {
            controls.menuName.classList.toggle(
                "sold-out-menu-name",
                soldOut
            );
        }
    });

    renderCurrentOrderCounts();
}


// ==========================================================
// 메뉴 수량 버튼 연결
// ==========================================================

function connectCounter(menuKey) {
    const controls =
        MENU_CONTROLS[menuKey];

    controls.minusButton.addEventListener(
        "click",
        function () {
            if (
                currentOrder[menuKey] > 0
            ) {
                currentOrder[menuKey] -= 1;
            }

            updateMenuControls();
        }
    );

    controls.plusButton.addEventListener(
        "click",
        function () {
            const availableStock =
                stock[menuKey];

            if (availableStock <= 0) {
                return;
            }

            if (
                currentOrder[menuKey] >=
                availableStock
            ) {
                alert(
                    `${MENU_INFO[menuKey].name} 재고는 ${availableStock}개입니다.`
                );

                return;
            }

            currentOrder[menuKey] += 1;

            updateMenuControls();
        }
    );
}


connectCounter("chiliShrimp");
connectCounter("creamShrimp");
connectCounter("tornadoPotato");


// ==========================================================
// 현재 입력 수량 초기화
// ==========================================================

function resetCurrentOrder() {
    currentOrder.chiliShrimp = 0;
    currentOrder.creamShrimp = 0;
    currentOrder.tornadoPotato = 0;

    updateMenuControls();
}


// ==========================================================
// 음성 안내
// ==========================================================

function getKoreanVoice() {
    if (!("speechSynthesis" in window)) {
        return null;
    }

    const voices =
        window.speechSynthesis.getVoices();

    return (
        voices.find(function (voice) {
            return voice.lang
                .toLowerCase()
                .startsWith("ko");
        }) || null
    );
}


function speakMessage(message) {
    if (!("speechSynthesis" in window)) {
        alert(
            "현재 브라우저에서는 음성 안내를 지원하지 않습니다."
        );

        return;
    }

    window.speechSynthesis.cancel();

    const speech =
        new SpeechSynthesisUtterance(
            message
        );

    speech.lang = "ko-KR";
    speech.rate = 0.9;
    speech.pitch = 1;
    speech.volume = 1;

    const koreanVoice =
        getKoreanVoice();

    if (koreanVoice) {
        speech.voice = koreanVoice;
    }

    window.speechSynthesis.speak(
        speech
    );
}


function announceOrder(orderNumber) {
    speakMessage(
        `${orderNumber}번 고객님, 주문하신 음식이 준비되었습니다.`
    );
}


if ("speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged =
        function () {
            getKoreanVoice();
        };
}


// ==========================================================
// 주문 접수 후 경과시간
// ==========================================================

function getElapsedMinutes(createdAt) {
    const elapsedMilliseconds =
        Date.now() - createdAt;

    const elapsedMinutes =
        Math.floor(
            elapsedMilliseconds / 60000
        );

    return Math.max(
        elapsedMinutes,
        0
    );
}


function getElapsedClass(elapsedMinutes) {
    if (elapsedMinutes >= 20) {
        return "elapsed-danger";
    }

    if (elapsedMinutes >= 10) {
        return "elapsed-warning";
    }

    return "elapsed-normal";
}


// ==========================================================
// 현재 주문 메뉴 HTML
// ==========================================================

function createMenuHtml(order) {
    const menuRows = [];

    if (order.chiliShrimp > 0) {
        menuRows.push(`
            <div class="menu-row">
                <span>칠리새우</span>
                <strong>${order.chiliShrimp}</strong>
            </div>
        `);
    }

    if (order.creamShrimp > 0) {
        menuRows.push(`
            <div class="menu-row">
                <span>크림새우</span>
                <strong>${order.creamShrimp}</strong>
            </div>
        `);
    }

    if (order.tornadoPotato > 0) {
        menuRows.push(`
            <div class="menu-row">
                <span>회오리감자</span>
                <strong>${order.tornadoPotato}</strong>
            </div>
        `);
    }

    return menuRows.join("");
}


// ==========================================================
// 현재 주문 카드 HTML
// ==========================================================

function createCurrentOrderHtml(order) {
    const elapsedMinutes =
        getElapsedMinutes(order.createdAt);

    const elapsedClass =
        getElapsedClass(elapsedMinutes);

    const isCooking =
        order.status === "cooking";

    const cookingButtonText =
        isCooking
            ? "조리중"
            : "조리 시작";

    const cookingButtonClass =
        isCooking
            ? "cooking-start-button is-cooking"
            : "cooking-start-button";

    return `
        <article
    class="current-order-item ${
        isCooking
            ? "cooking-order"
            : "waiting-order"
    }">

            <div class="order-number-row">

                <button
                    type="button"
                    class="order-number-button"
                    data-order-id="${order.id}"
                    aria-label="${order.number}번 주문 호출">
                    ${order.number}
                </button>

                <span
                    class="elapsed-time ${elapsedClass}">
                    ${elapsedMinutes}분
                </span>

                <button
                    type="button"
                    class="${cookingButtonClass}"
                    data-order-id="${order.id}"
                    ${isCooking ? "disabled" : ""}>
                    ${cookingButtonText}
                </button>

            </div>

            <div class="order-menu-list">
                ${createMenuHtml(order)}
            </div>

        </article>
    `;
}


// ==========================================================
// 현재 주문 화면 출력
// ==========================================================

function renderCurrentOrders() {
    currentOrdersContainer.innerHTML = "";

    const visibleOrders =
        orders.slice(
            0,
            MAX_VISIBLE_ORDERS
        );

    if (visibleOrders.length === 0) {
        currentOrdersContainer.innerHTML = `
            <div class="empty-orders">
                현재 주문이 없습니다.
            </div>
        `;
    } else {
        visibleOrders.forEach(
            function (order) {
                currentOrdersContainer
                    .insertAdjacentHTML(
                        "beforeend",
                        createCurrentOrderHtml(
                            order
                        )
                    );
            }
        );
    }

    renderCurrentOrdersSummary();
}


// ==========================================================
// 현재 주문 메뉴 합계
// ==========================================================

function getWaitingMenuTotals() {
    return orders.reduce(
        function (totals, order) {
            totals.chiliShrimp +=
                order.chiliShrimp;

            totals.creamShrimp +=
                order.creamShrimp;

            totals.tornadoPotato +=
                order.tornadoPotato;

            return totals;
        },
        {
            chiliShrimp: 0,
            creamShrimp: 0,
            tornadoPotato: 0
        }
    );
}


// ==========================================================
// 현재 주문 하단 요약
// ==========================================================

function renderCurrentOrdersSummary() {
    const hiddenCount =
        Math.max(
            orders.length -
                MAX_VISIBLE_ORDERS,
            0
        );

    const totals =
        getWaitingMenuTotals();

    waitingCountText.textContent =
        `대기 주문 ${orders.length}건`;

    hiddenOrderCountText.textContent =
        hiddenCount > 0
            ? `화면 밖 주문 ${hiddenCount}건`
            : "";

    summaryChili.textContent =
        `🌶️ 칠리새우 ${totals.chiliShrimp}개`;

    summaryCream.textContent =
        `🍤 크림새우 ${totals.creamShrimp}개`;

    summaryPotato.textContent =
        `🍟 회오리감자 ${totals.tornadoPotato}개`;
}


// ==========================================================
// 조리 시작
// ==========================================================

function startCooking(orderId) {
    const order =
        orders.find(function (item) {
            return item.id === orderId;
        });

    if (!order) {
        return;
    }

    if (order.status === "cooking") {
        return;
    }

    order.status = "cooking";
    order.cookingStartedAt = Date.now();

    saveState();
    renderAll();
}


// ==========================================================
// 현재 주문 → 번호 호출
// ==========================================================

function moveOrderToCalled(orderId) {
    const orderIndex =
        orders.findIndex(
            function (order) {
                return order.id === orderId;
            }
        );

    if (orderIndex === -1) {
        return;
    }

    const movedOrder =
        orders.splice(
            orderIndex,
            1
        )[0];

    movedOrder.status = "called";
    movedOrder.calledAt = Date.now();

    calledOrders.push(movedOrder);

    saveState();
    renderAll();

    announceOrder(
        movedOrder.number
    );
}


// ==========================================================
// 현재 주문 영역 클릭
// ==========================================================

currentOrdersContainer.addEventListener(
    "click",
    function (event) {
        const cookingButton =
            event.target.closest(
                ".cooking-start-button"
            );

        if (cookingButton) {
            const orderId =
                Number(
                    cookingButton.dataset.orderId
                );

            startCooking(orderId);

            return;
        }

        const numberButton =
            event.target.closest(
                ".order-number-button"
            );

        if (!numberButton) {
            return;
        }

        const orderId =
            Number(
                numberButton.dataset.orderId
            );

        moveOrderToCalled(orderId);
    }
);


// ==========================================================
// 번호 호출 HTML
// ==========================================================

function createCalledOrderHtml(order) {
    return `
        <button
            type="button"
            class="called-order-number"
            data-order-id="${order.id}"
            aria-label="${order.number}번 수령 완료"
            title="고객 수령 완료">
            ${order.number}
        </button>
    `;
}


// ==========================================================
// 번호 호출 화면 출력
// ==========================================================

function renderCalledOrders() {
    calledOrdersContainer.innerHTML = "";

    if (calledOrders.length === 0) {
        calledOrdersContainer.innerHTML = `
            <p class="call-empty">
                호출 중인 주문이 없습니다.
            </p>
        `;

        recallButton.disabled = true;

        return;
    }

    calledOrders.forEach(
        function (order) {
            calledOrdersContainer
                .insertAdjacentHTML(
                    "beforeend",
                    createCalledOrderHtml(
                        order
                    )
                );
        }
    );

    recallButton.disabled = false;
}


// ==========================================================
// 호출번호 클릭 → 수령 완료
// ==========================================================

calledOrdersContainer.addEventListener(
    "click",
    function (event) {
        const calledButton =
            event.target.closest(
                ".called-order-number"
            );

        if (!calledButton) {
            return;
        }

        const orderId =
            Number(
                calledButton.dataset.orderId
            );

        const orderIndex =
            calledOrders.findIndex(
                function (order) {
                    return order.id === orderId;
                }
            );

        if (orderIndex === -1) {
            return;
        }

        calledOrders.splice(
            orderIndex,
            1
        );

        saveState();
        renderCalledOrders();
    }
);


// ==========================================================
// 전체 재호출
// ==========================================================

recallButton.addEventListener(
    "click",
    function () {
        if (calledOrders.length === 0) {
            return;
        }

        const orderNumberText =
            calledOrders
                .map(function (order) {
                    return `${order.number}번`;
                })
                .join(", ");

        speakMessage(
            `${orderNumberText} 고객님, 주문하신 음식이 준비되었습니다.`
        );
    }
);


// ==========================================================
// 예상 대기시간 계산
// ==========================================================

function calculateWaitingMinutes() {
    if (orders.length === 0) {
        return 0;
    }

    const totals =
        getWaitingMenuTotals();

    const totalShrimp =
        totals.chiliShrimp +
        totals.creamShrimp;

    const shrimpBatches =
        Math.ceil(
            totalShrimp /
            SHRIMP_BATCH_SIZE
        );

    const shrimpMinutes =
        shrimpBatches *
        SHRIMP_BATCH_MINUTES;

    const potatoMinutes =
        totals.tornadoPotato *
        POTATO_MINUTES;

    return (
        shrimpMinutes +
        potatoMinutes
    );
}


// ==========================================================
// 재고 색상 클래스
// ==========================================================

function getStockClass(quantity) {
    // 0개: 회색
    if (quantity === 0) {
        return "stock-soldout";
    }

    // 1~9개: 빨강
    if (quantity < 10) {
        return "stock-danger";
    }

    // 10~19개: 주황
    // 20개 이상이 초록이므로 20은 초록에 포함
    if (quantity < 20) {
        return "stock-low";
    }

    // 20개 이상: 초록
    return "stock-normal";
}


// ==========================================================
// 재고 한 항목 출력
// ==========================================================

function renderStockItem(
    element,
    icon,
    menuName,
    quantity
) {

    element.className = "";

    if (quantity === 0) {

        element.classList.add("stock-soldout");

        element.textContent =
            `${icon} ${menuName} 품절`;

        return;
    }

    if (quantity < 10) {

        element.classList.add("stock-danger");

    } else if (quantity < 20) {

        element.classList.add("stock-low");

    } else {

        element.classList.add("stock-normal");

    }

    element.textContent =
        `${icon} ${menuName} ${quantity}`;

}


// ==========================================================
// 현재 현황 출력
// ==========================================================

function renderStatus() {
    const waitingMinutes =
        calculateWaitingMinutes();

    estimatedTime.textContent =
        `${waitingMinutes}분`;

    waitingOrdersText.textContent =
        `대기 ${orders.length}건`;

    salesChili.textContent =
        `🌶️ 칠리새우 ${dailySales.chiliShrimp}`;

    salesCream.textContent =
        `🍤 크림새우 ${dailySales.creamShrimp}`;

    salesPotato.textContent =
        `🍟 회오리감자 ${dailySales.tornadoPotato}`;

    renderStockItem(
        stockChili,
        "🌶️",
        "칠리새우",
        stock.chiliShrimp
    );

    renderStockItem(
        stockCream,
        "🍤",
        "크림새우",
        stock.creamShrimp
    );

    renderStockItem(
        stockPotato,
        "🍟",
        "회오리감자",
        stock.tornadoPotato
    );

    updateMenuControls();
}


// ==========================================================
// 재고 직접 수정
// ==========================================================

function editStock(menuKey) {
    openNumericKeypad("stock", menuKey);
}


stockChili.addEventListener(
    "click",
    function () {
        editStock("chiliShrimp");
    }
);

stockCream.addEventListener(
    "click",
    function () {
        editStock("creamShrimp");
    }
);

stockPotato.addEventListener(
    "click",
    function () {
        editStock("tornadoPotato");
    }
);


stockChili.title =
    "클릭하여 칠리새우 재고 수정";

stockCream.title =
    "클릭하여 크림새우 재고 수정";

stockPotato.title =
    "클릭하여 회오리감자 재고 수정";

stockChili.style.cursor = "pointer";
stockCream.style.cursor = "pointer";
stockPotato.style.cursor = "pointer";


// ==========================================================
// 중복 주문번호 확인
// ==========================================================

function isDuplicateOrderNumber(
    orderNumber
) {
    const currentOrderExists =
        orders.some(
            function (order) {
                return (
                    order.number ===
                    orderNumber
                );
            }
        );

    const calledOrderExists =
        calledOrders.some(
            function (order) {
                return (
                    order.number ===
                    orderNumber
                );
            }
        );

    return (
        currentOrderExists ||
        calledOrderExists
    );
}


// ==========================================================
// 재고 부족 확인
// ==========================================================

function validateStock() {
    const menuKeys = [
        "chiliShrimp",
        "creamShrimp",
        "tornadoPotato"
    ];

    for (const menuKey of menuKeys) {
        const requestedQuantity =
            currentOrder[menuKey];

        const availableQuantity =
            stock[menuKey];

        if (
            requestedQuantity >
            availableQuantity
        ) {
            const menu =
                MENU_INFO[menuKey];

            alert(
                `${menu.name} 재고가 부족합니다.\n\n` +
                `현재 재고: ${availableQuantity}개\n` +
                `주문 수량: ${requestedQuantity}개`
            );

            return false;
        }
    }

    return true;
}


// ==========================================================
// 주문 등록
// ==========================================================

function registerOrder() {
    const enteredOrderNumber =
        getSafeNextOrderNumber(
            nextOrderNumber
        );

    if (
        !Number.isInteger(
            enteredOrderNumber
        ) ||
        enteredOrderNumber <= 0
    ) {
        alert(
            "올바른 주문번호를 입력해 주세요."
        );

        return;
    }

    const totalMenuCount =
        currentOrder.chiliShrimp +
        currentOrder.creamShrimp +
        currentOrder.tornadoPotato;

    if (totalMenuCount === 0) {
        alert(
            "메뉴를 하나 이상 선택해 주세요."
        );

        return;
    }

    if (
        isDuplicateOrderNumber(
            enteredOrderNumber
        )
    ) {
        alert(
            "이미 사용 중인 주문번호입니다."
        );

        return;
    }

    if (!validateStock()) {
        return;
    }

    const newOrder = {
        id: internalOrderId,

        number:
            enteredOrderNumber,

        chiliShrimp:
            currentOrder.chiliShrimp,

        creamShrimp:
            currentOrder.creamShrimp,

        tornadoPotato:
            currentOrder.tornadoPotato,

        createdAt:
            Date.now(),

        status:
            "waiting",

        cookingStartedAt:
            null
    };

    internalOrderId += 1;

    orders.push(newOrder);

    // 누적 판매량 증가

    dailySales.chiliShrimp +=
        newOrder.chiliShrimp;

    dailySales.creamShrimp +=
        newOrder.creamShrimp;

    dailySales.tornadoPotato +=
        newOrder.tornadoPotato;

    // 재고 자동 차감

    stock.chiliShrimp -=
        newOrder.chiliShrimp;

    stock.creamShrimp -=
        newOrder.creamShrimp;

    stock.tornadoPotato -=
        newOrder.tornadoPotato;

    resetCurrentOrder();

    nextOrderNumber =
        enteredOrderNumber + 1;

    updateOrderNumberDisplay();

    saveState();
    renderAll();
}


registerButton.addEventListener(
    "click",
    registerOrder
);


orderNumberInput.addEventListener(
    "click",
    function () {
        openNumericKeypad("orderNumber");
    }
);


document.querySelectorAll(
    "[data-digit]"
).forEach(function (button) {
    button.addEventListener(
        "click",
        function () {
            const digit = button.dataset.digit;

            if (digit === undefined || digit === null) {
                return;
            }

            handleDigitInput(digit);
        }
    );
});


document.querySelectorAll(
    "[data-action]"
).forEach(function (button) {
    button.addEventListener(
        "click",
        function () {
            const action = button.dataset.action;

            if (action === "cancel") {
                closeNumericKeypad();
                return;
            }

            if (action === "backspace") {
                handleBackspace();
            }
        }
    );
});


numericKeypadConfirmButton.addEventListener(
    "click",
    applyNumericKeypadValue
);


numericKeypadModal.addEventListener(
    "click",
    function (event) {
        if (event.target === numericKeypadModal) {
            closeNumericKeypad();
        }
    }
);


// ==========================================================
// 주문 초기화
// ==========================================================

resetButton.addEventListener(
    "click",
    function () {
        const shouldReset =
            window.confirm(
                "현재 주문과 호출 중인 주문을 모두 삭제하시겠습니까?\n\n누적판매량과 재고량은 유지됩니다."
            );

        if (!shouldReset) {
            return;
        }

        orders = [];
        calledOrders = [];

        internalOrderId = 1;

        nextOrderNumber = 1;
        updateOrderNumberDisplay();

        resetCurrentOrder();

        if (
            "speechSynthesis" in window
        ) {
            window.speechSynthesis.cancel();
        }

        saveState();
        renderAll();
    }
);


// ==========================================================
// 영업 종료 요약
// ==========================================================

function createBusinessSummary() {
    const totalSales =
        dailySales.chiliShrimp +
        dailySales.creamShrimp +
        dailySales.tornadoPotato;

    return (
        "오늘 판매 현황\n\n" +

        `🌶️ 칠리새우: ${dailySales.chiliShrimp}개\n` +
        `🍤 크림새우: ${dailySales.creamShrimp}개\n` +
        `🍟 회오리감자: ${dailySales.tornadoPotato}개\n\n` +

        `총 판매수량: ${totalSales}개\n\n` +

        "남은 재고\n\n" +

        `🌶️ 칠리새우: ${stock.chiliShrimp}개\n` +
        `🍤 크림새우: ${stock.creamShrimp}개\n` +
        `🍟 회오리감자: ${stock.tornadoPotato}개`
    );
}


// ==========================================================
// 영업 종료
// ==========================================================

closeButton.addEventListener(
    "click",
    function () {
        const businessSummary =
            createBusinessSummary();

        alert(businessSummary);

        const shouldClose =
            window.confirm(
                "영업을 종료하시겠습니까?\n\n" +
                "현재 주문, 호출 주문, 누적판매량과 재고량이 모두 초기화됩니다."
            );

        if (!shouldClose) {
            return;
        }

        orders = [];
        calledOrders = [];

        dailySales = {
            chiliShrimp: 0,
            creamShrimp: 0,
            tornadoPotato: 0
        };

        stock = {
            chiliShrimp: 0,
            creamShrimp: 0,
            tornadoPotato: 0
        };

        internalOrderId = 1;

        nextOrderNumber = 1;
        updateOrderNumberDisplay();

        resetCurrentOrder();

        if (
            "speechSynthesis" in window
        ) {
            window.speechSynthesis.cancel();
        }

        localStorage.removeItem(
            STORAGE_KEY
        );

        renderAll();

        alert(
            "영업이 종료되었습니다."
        );
    }
);


// ==========================================================
// 전체 화면 출력
// ==========================================================

function renderAll() {
    renderCurrentOrders();
    renderCalledOrders();
    renderStatus();
}


// ==========================================================
// 앱 시작
// ==========================================================

function initializeApp() {
    const stateLoaded =
        loadState();

    if (!stateLoaded) {
        nextOrderNumber = 1;
    }

    updateOrderNumberDisplay();

    resetCurrentOrder();
    renderAll();
}


initializeApp();


// ==========================================================
// 경과시간 자동 갱신
// ==========================================================

setInterval(
    function () {
        renderCurrentOrders();
        renderStatus();
    },
    60000
);
