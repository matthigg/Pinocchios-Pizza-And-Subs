document.addEventListener('DOMContentLoaded', function() {

  // Reloads page if user hits the "Back" button
  // https://stackoverflow.com/questions/20899274/how-to-refresh-page-on-back-button-click
  if(!!window.performance && window.performance.navigation.type === 2) {
    console.log('Reloading');
    window.location.reload();
  }

  // Retrieve extras and toppings items data from 'storage' <div> (just some
  // random <div> with id='storage') within index.html's DOM. The data is stored
  // as strings that get serialized in views.py before ending up in the DOM.
  storage = document.querySelector('#storage');
  storage_extras = storage.getAttribute('data-storage_extras');
  storage_toppings = storage.getAttribute('data-storage_toppings');

  // Attach 'click' event listeners to all <input> checkboxes on page load
  inputs = document.querySelectorAll('input')
  for (let i = 0; i < inputs.length; i++) {
    inputs[i].addEventListener('click', function() {
      select_item(this);
    });
  };

  // Create list to keep track of active menu item selections, initialize total 
  // price, initialize the total number of items that have been ordered (ie. the
  // number of items in the shopping cart), go through localStorage and actually
  // count the number of items that are associated with the currently logged in
  // user (which is obtained from the DOM) & add that number to the DOM on intial 
  // page load, set the total price of current selections (which should be 0) to 
  // $0 on initial page load
  active_selections = []
  let total_price = 0;
  let items_ordered_count = 0;
  let user = document.querySelector('#user').innerHTML;

  for (let j = 0; j < localStorage.length; j++) {
    if (JSON.parse(localStorage.getItem(j))['user'] === user) {
      items_ordered_count++;
    };
  };
  document.querySelector('#total_price').append(total_price.toFixed(2));
  document.querySelector('#number-of-items-ordered').innerHTML = items_ordered_count;  

  // --------------------- CREATE CHECKBOX ---------------------------------------

  // This function is only called when extras for subs, or toppings for pizzas
  // are displayed, to make checkboxes for those items. These are different from
  // the checkboxes created via HTML on the index.html page. Each checkbox has
  // a class = tr_id which is later used to associate the checkbox with its menu
  // item. The 'limit' parameter is intended to be used for pizza toppings in 
  // order to limit the number of toppings that can be selected depending on the
  // pizza, and the 'price' parameter is intended to add the price of any selected 
  // extras for subs.
  function create_checkbox(tr_id, name, limit, price, size) {
    const checkbox = document.createElement('input');
    checkbox.className = tr_id;
    checkbox.name = name;
    checkbox.setAttribute("data-price", price);
    checkbox.type = 'checkbox';

    // The onclick function for each checkbox updates the count for the total 
    // number of checkboxes selected.
    checkbox.onclick = function() {
      let count = 0;
      list = document.getElementsByClassName(tr_id);
      for (let i = 0; i < list.length; i++) {
        if (list[i].checked === true) {
          count++;
        };
      };

      // Disable all other checkboxes if a limit exists (3rd parameter)
      if (count === limit) {
        for (let i = 0; i < list.length; i++) {
          if (list[i].checked !== true) {
            list[i].disabled = true;
          };
        };
      } else {
        for (let i = 0; i < list.length; i++) {
          list[i].disabled = false;
        };
      };

      // Add the currently selected item to the 'selections' <div> in the DOM
      // (the 'selections' <div> acts as a sort of staging area for currently 
      // selected items).
      selections();
    };
    return checkbox;
  };

  // --------------------- CREATE LIST -------------------------------------------

  function create_list(name) {
    const li = document.createElement('li');
    li.name = name
    li.innerHTML = name;
    return li;
  }

  // --------------------- HIDE --------------------------------------------------

  // Hide toppings and extras
  function hide(obj, delete_index, scenario) {

    // Variables passed in from <input> attributes on index.html
    tr_id = obj.getAttribute('data-tr_id');

    // Scenario 1: If a different checkbox is checked but in the same row as 
    // active selection, set *.clicked = false and clear that active selection 
    // from active_selections[] 
    if (delete_index && scenario === 1) {
      var as_td_id = active_selections[delete_index[0]]['td_id']
      var uncheck = document.querySelectorAll('[data-td_id = "' + as_td_id + '"]');
      if (uncheck) {
        for (let i = 0; i < uncheck.length; i++) {
          uncheck[i].checked = false;
        };
      };
      delete active_selections[delete_index[0]];
      const items = document.querySelector('[class = "' + tr_id + '"]');
      if (items) {
        items.parentNode.removeChild(items);
      };
    };

    // Scenario 2: If the same checkbox is clicked twice in a row, clear both of 
    // its entries in active_selections[] and hide the items
    if (delete_index && scenario === 2) {
      delete active_selections[delete_index[0]];
      delete active_selections[delete_index[1]];
      const items = document.querySelectorAll('[class = "' + tr_id + '"]');
      if (items) {
        for (let i = 0; i < items.length; i++) {
          items[i].parentNode.removeChild(items[i]);
        };
      };
    };
  };

  // --------------------- INDEX -------------------------------------------------

  // Figure out the index of the HTML child objects of <tbody>, namely topping and
  // extra rows, <tr>'s, within the DOM. Pizza toppings go in a separate column
  // from sub extras in the index.html DOM, so an attribute called 'category'
  // was created to correcty determine the index of sub extras which is used to
  // place them correctly on the webpage -- basically, pizzas and their toppings
  // are in the left column, subs and their extras are in the right. If for some
  // reason you want to scale up to 3 or more columns, you'll have to come up with
  // a new system or create new categories.
  function index(tr_id, category) {
    let index = 0;
    if (category === 'extra') {
      for (let i = 0; i < tbody_extra.childNodes.length; i++) {
        if (tbody_extra.childNodes[i].id === tr_id) {
          index = i;
        };
      };
    } else {
      for (let i = 0; i < tbody.childNodes.length; i++) {
        if (tbody.childNodes[i].id === tr_id) {
          index = i;
        };
      };
    };

    console.log('index: ', index)

    return index;
  };

  // --------------------- SELECT ITEM -------------------------------------------

  // Handle when a user clicks a checkbox on the menu
  function select_item(obj) {

    // Get data from individual selected item -- tr_id represents the unique row
    // that the selected menu item is on, and td_id represents its unique checkbox
    data_extras = obj.getAttribute('data-extras');
    data_toppings = obj.getAttribute('data-toppings');
    name = obj.getAttribute('name');
    size = obj.getAttribute('data-size');
    td_id = obj.getAttribute('data-td_id');
    tr_id = obj.getAttribute('data-tr_id');

    // HANDLE EXTRAS -------------------------------------------------------------
    if (data_extras === 'true') {

      // Update active selections
      active_selections.push({'td_id': td_id, 'tr_id': tr_id});

      // Determine which overall DOM menu column the extras are in

      // Show extras items
      show_extras(tr_id, size);

      // Scenario 1: Handle a different checkbox being clicked, but on the same 
      // row as an active selection
      del_scenario_1 = []
      for (let i = 0; i < active_selections.length; i++) {
        if (active_selections[i]) {
          if (!(active_selections[i]['td_id'] === td_id) && active_selections[i]['tr_id'] === tr_id) {
            del_scenario_1.push(i);
          };        
        };
      };
      if (del_scenario_1.length === 1) {
        hide(obj, del_scenario_1, del_scenario_1.length);
      };

      // Scenario 2: Handle the same checkbox being clicked twice
      del_scenario_2 = [];
      for (let i = 0; i < active_selections.length; i++) {
        if (active_selections[i]) {
          if (active_selections[i]['td_id'] === td_id && active_selections[i]['tr_id'] === tr_id) {
            del_scenario_2.push(i);
          };
        };
      };
      if (del_scenario_2.length === 2) {
        hide(obj, del_scenario_2, del_scenario_2.length);
      };
    };
    
    // HANDLE TOPPINGS -----------------------------------------------------------
    if (data_toppings === 'true') {

      // Update active selections
      active_selections.push({'td_id': td_id, 'tr_id': tr_id});

      if (name === '1 topping') {
        show_toppings(tr_id, size, 1);
      } else if (name === '2 toppings') {
        show_toppings(tr_id, size, 2);
      } else if (name === '3 toppings') {
        show_toppings(tr_id, size, 3);
      } if (name === '1 item') {
        show_toppings(tr_id, size, 1);
      } else if (name === '2 items') {
        show_toppings(tr_id, size, 2);
      } else if (name === '3 items') {
        show_toppings(tr_id, size, 3);
      } else if (name === 'Special') {
        show_toppings(tr_id, size, 5);
      };

      // Scenario 1: Handle a different checkbox being clicked, but on the same 
      // row as an active selection
      del_scenario_1 = []
      for (let i = 0; i < active_selections.length; i++) {
        if (active_selections[i]) {
          if (!(active_selections[i]['td_id'] === td_id) && active_selections[i]['tr_id'] === tr_id) {
            del_scenario_1.push(i);
          };        
        };
      };
      if (del_scenario_1.length === 1) {
        hide(obj, del_scenario_1, del_scenario_1.length);
      };

      // Scenario 2: Handle the same checkbox being clicked twice
      del_scenario_2 = [];
      for (let i = 0; i < active_selections.length; i++) {
        if (active_selections[i]) {
          if (active_selections[i]['td_id'] === td_id && active_selections[i]['tr_id'] === tr_id) {
            del_scenario_2.push(i);
          };
        };
      };
      if (del_scenario_2.length === 2) {
        hide(obj, del_scenario_2, del_scenario_2.length);
      };
    };
    
    // Add the currently selected item to the 'selections' <div> in the DOM (this
    // section acts as a sort of staging area for currently selected items).
    selections();
  };


  // --------------------- SHOW EXTRAS -------------------------------------------

  function show_extras(tr_id, size) {

    // Create a new row, <tr>, that includes list of extras.
    const tr_extras = document.createElement('tr');
    const td_extras = document.createElement('td');
    const td_extras_checkbox = document.createElement('td');
    const td_extras_price = document.createElement('td');
    const ul_extras = document.createElement('ul');

    // Checkbox variables
    let limit = 10;
    let price = 0;

    for (let i = 0; i < JSON.parse(storage_extras).length; i++) {

      // Parse storage_extras string and grab the name of the individual extra
      // names and prices
      extra = JSON.parse(storage_extras)[i]['fields']['item']
      extra_price_sm = JSON.parse(storage_extras)[i]['fields']['price_sm']
      extra_price_lg = JSON.parse(storage_extras)[i]['fields']['price_lg']

      // Show all 4 extras items for the Steak + Cheese sub
      if (tr_id === 'Subs + Steak + Cheese') {

        // Create list of sub extras
        ul_extras.append(create_list(JSON.parse(storage_extras)[i]['fields']['item']));

        // Display extras' prices
        const br_price = document.createElement('br');
        if (size === 'Small') {
          td_extras_price.append('+ ', extra_price_sm, br_price);
          price = extra_price_sm;
        } else if (size === 'Large') {
          td_extras_price.append('+ ', extra_price_lg, br_price);
          price = extra_price_lg;
        };

        // Create a checkbox
        const br_checkbox = document.createElement('br');
        td_extras_checkbox.append(create_checkbox(tr_id, extra, limit, price, size), br_checkbox);

      // Only show the Extra Cheese option for all other subs
      } else {
        if (JSON.parse(storage_extras)[i]['fields']['item'] === 'Extra Cheese') {

          // Create list item of 'Extra Cheese' for all subs
          ul_extras.append(create_list(JSON.parse(storage_extras)[i]['fields']['item']));    

          // Display 'Extra Cheese' price for all subs
          const br_extras_prices = document.createElement('br');
          if (size === 'Small') {
            td_extras_price.append('+ ', extra_price_sm, br_extras_prices);
            price = extra_price_sm;
          } else if (size === 'Large') {
            td_extras_price.append('+ ', extra_price_lg, br_extras_prices);
            price = extra_price_lg;
          };

          // Create a checkbox
          td_extras_checkbox.append(create_checkbox(tr_id, extra, limit, price, size));
        };
      };
    };

    // Stitch together the extras row, <tr>, that will be inserted into the DOM
    td_extras.append(ul_extras);
    tr_extras.className = tr_id;
    tr_extras.dataset.category = 'extra';
    tr_extras.append(td_extras, td_extras_price, td_extras_checkbox);

    // Add extras row, <tr>, to DOM. These go in the right overall menu column 
    // (the menu is basically divided into two vertical columns) with a <tbody> 
    // tag that has id="tbody_extras".
    document.querySelector('#tbody_extra').insertBefore(tr_extras, tbody_extra.childNodes[index(tr_id, tr_extras.dataset.category) + 1]);
  };

  // --------------------- SHOW TOPPINGS -----------------------------------------

  function show_toppings(tr_id, size, limit) {

    // Create a new row, <tr>, that includes list of toppings.
    const tr_toppings = document.createElement('tr');
    const td_toppings = document.createElement('td');
    const td_toppings_checkbox = document.createElement('td');
    const ul_toppings = document.createElement('ul');

    // Checkbox variables
    let price = 0;

    for (let i = 0; i < JSON.parse(storage_toppings).length; i++) {

      // Parse storage_toppings string and grab the name of the individual topping
      topping = JSON.parse(storage_toppings)[i]['fields']['item']

      // Create list of pizza toppings
      ul_toppings.append(create_list(topping));

      // Create a checkbox
      const br_extras = document.createElement('br');
      td_toppings_checkbox.append(create_checkbox(tr_id, topping, limit, price, size), br_extras);
    };

    // Stitch together the toppings row, <tr>, that will be inserted into the DOM
    td_toppings.append(ul_toppings);
    tr_toppings.className = tr_id;
    tr_toppings.append(td_toppings, td_toppings_checkbox);

    // Add toppings row, <tr>, to DOM. 
    document.querySelector('tbody').insertBefore(tr_toppings, tbody.childNodes[index(tr_id) + 1]);
  };

  // --------------------- SELECTIONS --------------------------------------------

  // Place currently selected items into a "staging area" that is visible on
  // index.html and updated everytime the select_item() function is called, or
  // everytime an extras or toppings checkbox is checked
  function selections() {
    document.querySelector('#current_selections').innerHTML = '';
    document.querySelector('#total_price').innerHTML = '';
    x = document.querySelectorAll('[type="checkbox"]')
    selected_menu_items = [];
    selected_extras_toppings = [];
    
    // Gather a list of every currently selected item on the menu. Menu item 
    // selections have data-tr_id attributes, and toppings and extras items have 
    // their class attribute === to the tr_id value of the menu item that they are 
    // associated with
    for (let i = 0; i < x.length; i++) {
      if (x[i].dataset.tr_id && x[i].checked) {
        selected_menu_items.push(x[i]);
      };
      if (x[i]['className'] && x[i].checked) {
        selected_extras_toppings.push(x[i]);
      };
    };
  
    // Append selected menu items to an unordered list <li>
    let total_price = 0;
    for (let j = 0; j < selected_menu_items.length; j++) {
      const ul = document.createElement('ul');
      const li = document.createElement('li');
      if (selected_menu_items[j].dataset.size !== undefined) {
        const size = selected_menu_items[j].dataset.size;
        li.append(selected_menu_items[j].dataset.group, ': ', selected_menu_items[j].name, ', ', size);
      } else if (selected_menu_items[j].dataset.size === undefined) {
        li.append(selected_menu_items[j].dataset.group, ': ', selected_menu_items[j].name);
      };

      // Append selected extras or toppings to their respective menu item
      let total_extras_price = 0;
      for (let k = 0; k < selected_extras_toppings.length; k++) {
        if (selected_menu_items[j].dataset.tr_id === selected_extras_toppings[k]['className']) {

          // Append extras/toppings item
          const br = document.createElement('br');
          li.append(br, '- ', selected_extras_toppings[k]['name']);

          // Add price if it exists (extras have a price, toppings don't)
          const extras_price = parseFloat(selected_extras_toppings[k].dataset.price)
          total_extras_price += extras_price;
        };
      };

      // Stitch together selected menu items, extras, and toppings and calculate
      // the total price
      const br = document.createElement('br');
      const total_price_individual = parseFloat(selected_menu_items[j].value) + total_extras_price
      li.append(br, '$', total_price_individual.toFixed(2));
      ul.append(li);
      total_price += total_price_individual;

      // Place selected items and total price into the DOM
      document.querySelector('#current_selections').appendChild(ul);
    };

    // Append total price to the DOM
    document.querySelector('#total_price').append(total_price.toFixed(2));
  };

  // --------------------- ADD TO ORDER ------------------------------------------

  // Attach an *.onclick event handler
  document.querySelector('.index-add-to-order').onclick = () => {

    // Mimic what the selections() function does to gather data on selected
    // menu items, and any selected extras or toppings
    x = document.querySelectorAll('[type="checkbox"]')
    selected_menu_items = [];
    selected_extras_toppings = [];
    for (let i = 0; i < x.length; i++) {
      if (x[i].dataset.tr_id && x[i].checked) {
        selected_menu_items.push(x[i]);
      };
      if (x[i]['className'] && x[i].checked) {
        selected_extras_toppings.push(x[i]);
      };
    };

    // Store every attribute from any selected checkboxes as key:value pairs
    let previous_localStorage_length = localStorage.length;
    for (let j = 0; j < selected_menu_items.length; j++) {
      let data_group = selected_menu_items[j].dataset.group;
      let data_size = selected_menu_items[j].dataset.size;
      let data_td_id = selected_menu_items[j].dataset.td_id;
      let data_toppings = selected_menu_items[j].dataset.toppings;
      let data_tr_id = selected_menu_items[j].dataset.tr_id;
      let name = selected_menu_items[j]['name'];
      let value = selected_menu_items[j]['value'];
      let attributes = {
        "data_group": data_group,
        "data_size": data_size,
        "data_td_id": data_td_id,
        "data_toppings": data_toppings,
        "data_tr_id": data_tr_id,
        "extras_price": 0,
        "extras": [],
        "name": name,
        "toppings": [],
        "user": user,
        "value": value,
      };

      // Associate selected extras or toppings with their respective menu item
      for (let k = 0; k < selected_extras_toppings.length; k++) {
        if (selected_menu_items[j].dataset.tr_id === selected_extras_toppings[k]['className']) {

          // Handle pizza toppings
          if (selected_menu_items[j].dataset.group === 'Regular Pizza' || selected_menu_items[j].dataset.group === 'Sicilian Pizza') {

            // Add toppings item to attributes
            new_topping = selected_extras_toppings[k]['name'];
            old_toppings = attributes['toppings'];
            old_toppings.push(new_topping);
            attributes['toppings'] = old_toppings;
          };

          // Handle sub extras
          if (selected_menu_items[j].dataset.group === 'Subs') {

            // Add extras item to attributes
            new_extra = selected_extras_toppings[k]['name'];
            old_extras = attributes['extras'];
            old_extras.push(new_extra);
            attributes['extras'] = old_extras;
            attributes['extras_price'] += parseFloat(selected_extras_toppings[k].dataset.price)
          };
        };
      };

      // localStorage only stores strings, so you can convert dictionaries into 
      // strings when using *.setItem, and then back into dictionaries when
      // using *.getItem
      localStorage.setItem(j + previous_localStorage_length, JSON.stringify(attributes));
    };

    // Reload in order to clear all checkboxes and displayed selections
    window.location.reload();
  };
});
