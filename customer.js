// ==========================================================
// Pickup Board - 고객용 화면
// 관리자 화면 localStorage 연동
// ==========================================================

const STORAGE_KEY = "pickupBoardV3State";
const MAX_READY_ORDERS = 6;


// ==========================================================
// 관리자 데이터 불러오기
// ==========================================================

function getPickupBoardState() {
    try {
        const savedState = localStorage.getItem(STORAGE_KEY);

        if (!savedState) {
            return null;
        }

        return JSON.parse(savedState);

    } catch (error) {
        console.error(
            "Pickup Board 데이터를 불러오지 못했습니다.",
            error
        );

        return null;
    }
}


// ==========================================================
// 고객용 호출번호 화면 출력
// ==========================================================

function renderCustomerScreen() {
    const state = getPickupBoardState();

    if (!state) {
        renderReadyOrders([]);
        updateWaitingInfo(0, 0);
        return;
    }

    const orders =
        Array.isArray(state.orders)
            ? state.orders
            : [];

    const calledOrders =
        Array.isArray(state.calledOrders)
            ? state.calledOrders
            : [];


    // 최근 호출이 가장 앞으로 오도록 정렬
    const readyOrders = [...calledOrders]
        .sort(function (a, b) {
            return (b.calledAt || 0) - (a.calledAt || 0);
        })
        .slice(0, MAX_READY_ORDERS);


    renderReadyOrders(readyOrders);


    // 대기 주문 수
    const waitingCount = orders.length;


    // 예상 대기시간
    const waitingMinutes =
        calculateWaitingMinutes(orders);


    updateWaitingInfo(
        waitingCount,
        waitingMinutes
    );
}


// ==========================================================
// 준비 완료 주문번호 출력
// ==========================================================

function renderReadyOrders(readyOrders) {
    const grid =
        document.querySelector(".ready-number-grid");

    if (!grid) {
        return;
    }

    grid.innerHTML = "";


    readyOrders.forEach(function (order, index) {

        const card =
            document.createElement("div");

        card.className =
            "ready-number-card";


        // 가장 최근 호출
        if (index === 0) {
            card.classList.add("is-latest");
        }


        const number =
            document.createElement("strong");

        number.textContent =
            order.number;


        card.appendChild(number);


        // 방금 호출 표시
        if (index === 0) {

            const latestLabel =
                document.createElement("span");

            latestLabel.className =
                "latest-label";

            latestLabel.textContent =
                "방금 호출";

            card.appendChild(latestLabel);
        }


        grid.appendChild(card);
    });
}


// ==========================================================
// 예상 대기시간 계산
// 관리자 화면과 동일한 계산 기준
// ==========================================================

function calculateWaitingMinutes(orders) {

    let chiliShrimp = 0;
    let creamShrimp = 0;
    let tornadoPotato = 0;


    orders.forEach(function (order) {

        chiliShrimp +=
            Number(order.chiliShrimp) || 0;

        creamShrimp +=
            Number(order.creamShrimp) || 0;

        tornadoPotato +=
            Number(order.tornadoPotato) || 0;
    });


    const totalShrimp =
        chiliShrimp + creamShrimp;


    // 새우류 전체 2개당 5분
    const shrimpMinutes =
        Math.ceil(totalShrimp / 2) * 5;


    // 회오리감자 1개당 1분
    const potatoMinutes =
        tornadoPotato;


    return (
        shrimpMinutes +
        potatoMinutes
    );
}


// ==========================================================
// 하단 대기정보 출력
// ==========================================================

function updateWaitingInfo(
    waitingCount,
    waitingMinutes
) {

    const waitingCountElement =
        document.querySelector(
            ".waiting-info:first-child strong"
        );

    const waitingTimeElement =
        document.querySelector(
            ".waiting-info:last-child strong"
        );


    if (waitingCountElement) {
        waitingCountElement.textContent =
            `${waitingCount}건`;
    }


    if (waitingTimeElement) {

        waitingTimeElement.textContent =
            waitingMinutes > 0
                ? `약 ${waitingMinutes}분`
                : "0분";
    }
}


// ==========================================================
// 관리자 화면의 localStorage 변경 감지
// ==========================================================

window.addEventListener(
    "storage",
    function (event) {

        if (event.key === STORAGE_KEY) {
            renderCustomerScreen();
        }
    }
);


// ==========================================================
// 보조 동기화
// ==========================================================
// 브라우저/DeX 환경에 따라 storage 이벤트가 즉시 반영되지
// 않는 경우를 대비해 1초마다 현재 상태를 다시 확인한다.

setInterval(
    renderCustomerScreen,
    1000
);


// ==========================================================
// 최초 실행
// ==========================================================

renderCustomerScreen();