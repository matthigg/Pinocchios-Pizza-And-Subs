document.addEventListener('DOMContentLoaded', function() {

  // Reloads page if user hits the "Back" button
  // https://stackoverflow.com/questions/20899274/how-to-refresh-page-on-back-button-click
  if(!!window.performance && window.performance.navigation.type === 2) {
    console.log('Reloading');
    window.location.reload();
  }

  // Initialize total price for the order & get user name from the DOM
  let total_price = 0;
  let user = document.querySelector('#user').innerHTML;

  // --------------------- CREATE LIST -------------------------------------------

  function create_list(name) {
    const li = document.createElement('li');
    li.name = name
    li.innerHTML = name;
    return li;
  }

  // --------------------- DISPLAY ORDER -----------------------------------------

  // Create .header.width320 <div> element
  div_header_width320 = document.createElement('div');
  div_header_width320.className = "header width320";
  orders_div = document.querySelector('.orders')
  orders_div.insertBefore(div_header_width320, orders_div.childNodes[0]);

  // Create .left <div> element.
  div_left = document.createElement('div');
  div_left.className = "left"
  document.querySelector('.header.width320').append(div_left);

  // Create "Order:" heading
  document.querySelector('.left').innerHTML = "Order:";

  // Create the "Place Order" button if at least 1 order item exists, along with
  // a corresponding "Clear Order" link.
  for (let i = 0; i < localStorage.length; i++) {
    if (JSON.parse(localStorage.getItem(i))['user'] === user) {

      // 'Place Order' button 
      button_po = document.createElement('button');
      button_po.id = "place-order";
      button_po.innerHTML = "Place Order";
      document.querySelector('.place-order-div').append(button_po);

      // 'Clear Order' button
      button_co = document.createElement('button');
      button_co.className = "button-transparent nav-text clear-order";
      button_co.innerHTML = "Clear Order";
      button_co.addEventListener('click', () => {
        document.querySelectorAll('ul').forEach(ul => {
          ul.remove();
        }); 
        document.querySelector('#total_price').innerHTML = 0;
      });
      document.querySelector('.clear-order-div').append(button_co);
      break;
    };
  };

  // Retrieve and display items from localStorage

  for (let i = 0; i < localStorage.length; i++) {
    if (JSON.parse(localStorage.getItem(i))['user'] === user) {
      const data_group  = JSON.parse(localStorage.getItem(i))['data_group'];
      const data_size   = JSON.parse(localStorage.getItem(i))['data_size'];
      const data_tr_id  = JSON.parse(localStorage.getItem(i))['data_tr_id'];
      const name        = JSON.parse(localStorage.getItem(i))['name'];
      const price       = parseFloat(JSON.parse(localStorage.getItem(i))['value']);
    
      // Enclose each ordered item within an <li> element
      var item = '';
      if (data_size === undefined) {
        item = data_group + ', ' + name;
      } else {
        item = data_group + ', ' + name + ', ' + data_size;
      };
      const li = create_list(item);

      // Append any extras that were selected for subs items
      extras = JSON.parse(localStorage.getItem(i))['extras'];
      let total_extras_price = 0;
      if (extras.length !== 0) {
        for (let j = 0; j < extras.length; j++) {
          br_extras = document.createElement('br');
          li.append(br_extras, '- ', extras[j])
        };
        total_extras_price += JSON.parse(localStorage.getItem(i))['extras_price'];
      };

      // Append any toppings that were selected for pizza items
      toppings = JSON.parse(localStorage.getItem(i))['toppings'];
      if (toppings.length !== 0) {
        for (let j = 0; j < toppings.length; j++) {
          br_toppings = document.createElement('br');
          li.append(br_toppings, '- ', toppings[j])
        };
      };

      // Append the price of the individual item and any extras to the list of 
      // orders
      br = document.createElement('br');
      br2 = document.createElement('br');
      span = document.createElement('span');
      total_individual_price = price + total_extras_price;
      li.append(br, '$', total_individual_price.toFixed(2));
      li.append(br2, span);
      span.append(br2, 'X Remove Item');
      span.className = "remove-item"
      span.style.fontWeight = 'bold';
      span.style.cursor = 'pointer';

      // Add a link to remove a specific item from the order.
      span.addEventListener('click', function() {
        localStorage_length = localStorage.length;
        for (let i = 0; i < localStorage_length; i++) {
          if (JSON.parse(localStorage.getItem(i))['user'] === user &&
              JSON.parse(localStorage.getItem(i))['data_tr_id'] === data_tr_id &&
              JSON.parse(localStorage.getItem(i))['data_size'] === data_size) {
            localStorage.removeItem(i);

            // Re-assign keys to the remaining menu items stored in localStorage 
            // (assuming any remain) after removing a menu item.
            localStorageIndexUpdate();

            // Remove deleted menu item from the DOM.
            remove_ul = document.querySelector(`ul[data-user="${user}"][data-tr-id="${data_tr_id}"][data-size="${data_size}"]`);
            remove_ul.remove();

            // Update total price.
            total_price -= price - total_extras_price;
            document.querySelector('#total_price').innerHTML = total_price.toFixed(2);
            return;
          };
        };
      });

      // Stitch together the <li> element within a <ul> element and then insert it
      // into the DOM.
      const ul = document.createElement('ul');
      ul.setAttribute('data-user', user);
      ul.setAttribute('data-tr-id', data_tr_id);
      ul.setAttribute('data-size', data_size);
      ul.append(li);
      document.querySelector('#display_orders').append(ul);

      // Add the price of each item, plus any extras from subs, to the total price.
      total_price += price + total_extras_price;
    };
  };

  // Append the total price to the DOM.
  document.querySelector('#total_price').append(total_price.toFixed(2));

  // --------------------- SEND LOCALSTORAGE DATA TO SERVER ---------=------------

  document.querySelector('#place-order').onclick = () => {

    // Clear out the orders header and replace it with a simple "Your order has
    // been placed!" message
    header_width320 = document.querySelector('.header.width320')
    header_width320.parentNode.removeChild(header_width320)

    div = document.createElement('div');
    div.className = "alert alert-success";
    div.style.border = "2px solid";
    div.style.fontWeight = "bold";
    div.style.textAlign = "center";
    div.innerHTML = "Your order has been placed!";
    div_orders = document.querySelector('.orders');
    div_orders.insertBefore(div, div_orders.childNodes[0]);

    // Initialize POST request, extract the CSRF value from the index.html DOM,
    // and put that into the header of the POST request
    const request = new XMLHttpRequest();
    request.open('POST', '/orders');
    const csrf_token = document.querySelector('#csrf').childNodes[0]['value'];
    request.setRequestHeader("X-CSRFToken", csrf_token);

    // Retrieve items from localStorage and append them to localStorage_data, 
    // which is a FormData() object that can be used to transmit the data to the
    // server (ie. views.py).
    const localStorage_data = new FormData();
    for (let i = 0; i < localStorage.length; i++) {
      if (JSON.parse(localStorage.getItem(i))['user'] === user) {
        let data_group    = JSON.parse(localStorage.getItem(i))['data_group'];
        let data_size     = JSON.parse(localStorage.getItem(i))['data_size'];
        let extras        = JSON.parse(localStorage.getItem(i))['extras'];
        let extras_price  = JSON.parse(localStorage.getItem(i))['extras_price'];
        let name          = JSON.parse(localStorage.getItem(i))['name'];
        let toppings      = JSON.parse(localStorage.getItem(i))['toppings'];
        let price         = parseFloat(JSON.parse(localStorage.getItem(i))['value']);

        // Append data to localStorage_data (the FormData() object)
        localStorage_data.append('data_group',    data_group);
        localStorage_data.append('data_size',     data_size);
        localStorage_data.append('extras',        extras);
        localStorage_data.append('extras_price',  extras_price);
        localStorage_data.append('name',          name);
        localStorage_data.append('toppings',      toppings);
        localStorage_data.append('price',         price);
        localStorage_data.append('user',          user);
      };
    };

    // Send localStorage_data to views.py so that it can store all of the order
    // information in the database. Note -- this AJAX-type request sends the
    // order data to the server for storage, but the button on orders.html, when 
    // clicked, submits a GET request to redirect to success.html.
    request.send(localStorage_data);

    // Clear out the ordered items that were just sent to the server for database
    // storage from client-side localStorage, and remove any 'Clear Order' or 
    // 'Remove Item' links from the DOM.
    localStorageClear(user);
    clearOrderLinks();

    // Re-assign index numbers to any remaining items left in localStorage.
    localStorageIndexUpdate();
  };
});

// --------------------- UPDATE LOCALSTORAGE INDICES -----------------------------

// This function assigns array-like indices to each menu item in localStorage. A
// more complete description can be found in index.js under the same function
// name.
function localStorageIndexUpdate() {
  temp_array = []
  for (let [key, value] of Object.entries(localStorage)) {
    temp_array.push(value);
  }
  localStorage.clear();
  for (let i = 0; i < temp_array.length; i++) {
    localStorage.setItem(i, temp_array[i]);
  }
}

// Clear all menu items that are part of the current order from localStorage that
// are associated with a particular user.
function localStorageClear(user) {
  localStorage_length = localStorage.length;
  for (let i = 0; i < localStorage_length; i++) {
    if (JSON.parse(localStorage.getItem(i))['user'] === user) {
      localStorage.removeItem(i);
    };
  };
}

function removeItem() {

}

function clearOrderLinks () {
  document.querySelector('#place-order').remove();
  document.querySelector('.clear-order').remove();
  document.querySelectorAll('.remove-item').forEach(item => {
    item.remove();
  });
}
