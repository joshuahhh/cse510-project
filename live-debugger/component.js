import { liveDebugger, html} from './library.js'

const board = () => {
  // Define the board
  const num_rows_cols = 5
  const protag_img_src = "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/77a638c2-9d34-4f8d-9aef-edb8d196b304/d6ebtax-b9380050-b687-43dd-a42b-f74c3dd57307.png/v1/fill/w_1024,h_1303,strp/bowser_png_by_brokenheartdesignz_d6ebtax-fullview.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTMwMyIsInBhdGgiOiJcL2ZcLzc3YTYzOGMyLTlkMzQtNGY4ZC05YWVmLWVkYjhkMTk2YjMwNFwvZDZlYnRheC1iOTM4MDA1MC1iNjg3LTQzZGQtYTQyYi1mNzRjM2RkNTczMDcucG5nIiwid2lkdGgiOiI8PTEwMjQifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.Bw_-_BSZzKDu771C-F92ZtRMDCf_Su_x96sXfkVA3Zw"
  const enemy_img_src = "https://pngimg.com/uploads/mario/mario_PNG57.png"
  function getWidth() {
    return Math.max(
      document.body.scrollWidth,
      document.documentElement.scrollWidth,
      document.body.offsetWidth,
      document.documentElement.offsetWidth,
      document.documentElement.clientWidth
    );
  }
  const style = () => {
    const size = `${Math.min(100, getWidth() / num_rows_cols)}px`;
    return html`<style>
#game-board {
display: grid;
grid-template-columns: ${(size + " ").repeat(num_rows_cols)};
grid-template-rows: ${(size + " ").repeat(num_rows_cols)};
justify-content: center;
padding: 20px;
}
#game-board div {
background: #d9d9d9;
border: 2px solid black;
width: ${size};
height: ${size};
}
#game-board div.user-next {
background: blue;
}
#game-board div.correct-next {
background: green;
}
#game-board img {
height: ${size};
width: ${size};
cursor: grab;
position: absolute; /* layer images */
object-fit: scale-down; /* fit in cell */
}
textarea {
font-family: monospace !important;
}
</style>`;
  }
  document.body.appendChild(style())

  // Fix JS -- use old conventions
  // move HTML to HTML
  const board = html`<div id="game-board" tabindex="0">${Array(
    num_rows_cols ** 2
  )
    .fill()
    .map((_, i) => html`<div data-id='${i}'></div>`)}</div>`

  // Create Bowser (as an HTML image)
  // TODO enemy and protag names are reversed for some reason???
  let protag = html`<img id="protag" src="${enemy_img_src}" />`;
  let protag_pos = Math.floor(Math.random() * num_rows_cols ** 2);
  //console.log(board.outerHTML)
  board.querySelector(`div[data-id="${protag_pos}"]`).appendChild(protag);

  // Create Mario (as an HTML image)
  let enemy = html`<img id="enemy" src="${protag_img_src}" />`;
  let enemy_pos = protag_pos;
  while (enemy_pos === protag_pos) {
    enemy_pos = Math.floor(Math.random() * num_rows_cols ** 2);
  }
  board.querySelector(`div[data-id="${enemy_pos}"]`).appendChild(enemy);

  const divmod = (n) => [Math.floor(n / num_rows_cols), n % num_rows_cols, ];

  // Handle user input
  // EXPERIMENT NOTE they have to figure out that this should be async
  function applyUserInput() {
    let [protag_y, protag_x] = divmod(+protag.parentElement.dataset.id);
    let [enemy_y, enemy_x] = divmod(+enemy.parentElement.dataset.id);
    // Define Bowser's next move
    let [user_next_x, user_next_y] = [enemy_x + 1, enemy_y]/*liveDebugger('id1', {
      protag_x,
      protag_y,
      enemy_x,
      enemy_y,
      num_rows_cols
    })/*[1, 1]/*eval(`(${my_code})`)(
      protag_x,
      protag_y,
      enemy_x,
      enemy_y,
      num_rows_cols
    );*/
    let user_next = user_next_y * num_rows_cols + user_next_x;
    board.querySelector("div.user-next")?.classList.remove("user-next");
    board
      .querySelector(`div[data-id="${user_next}"]`)
      ?.classList.add("user-next");
  }

  return Object.assign(board, { applyUserInput });
}


const handlers = board => {
  function does_intersect(el, mouse) {
    return (
      mouse.clientX >= el.left &&
      mouse.clientX <= el.right &&
      mouse.clientY >= el.top &&
      mouse.clientY <= el.bottom
    );
  }

  // let board = document.querySelector("#game-board");
  let protag = board.querySelector("#protag");
  let enemy = board.querySelector("#enemy");
  let is_dragged = false;
  let dragged_elem = null;

  // Disable image preview drag
  protag.ondragstart = function () {
    return false;
  };
  enemy.ondragstart = function () {
    return false;
  };

  // Add image drag event listeners
  [].slice.call(board.children).forEach((el) => {
    el.addEventListener("mouseenter", function (event) {
      if (is_dragged) {
        el.appendChild(dragged_elem);
        board.applyUserInput();
      }
    });
  });

  // Add global image click event listeners
  document.addEventListener("mousedown", function (event) {
    if (does_intersect(protag.getBoundingClientRect(), event)) {
      dragged_elem = protag;
      is_dragged = true;
    } else if (does_intersect(enemy.getBoundingClientRect(), event)) {
      dragged_elem = enemy;
      is_dragged = true;
    }
  });
  document.addEventListener("mouseup", function () {
    is_dragged = false;
  });
}

const create_board = () => {
  const b = board()
  handlers(b)
  setTimeout(() => b.applyUserInput())   // Initializes the AI's response (after the element has been added to the page).
  return b
}

export { create_board }