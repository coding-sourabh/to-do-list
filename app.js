//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-skey:sourabh1234@cluster0.li7bq.mongodb.net/toDoListDB", {
  useNewUrlParser: true
});

const itemsSchema = { // schema
  name: String
};

const Item = mongoose.model("Item", itemsSchema); // model or collection

const item1 = new Item({
  name: "Welcome to your To Do list!"
});

const item2 = new Item({
  name: "Hit the + button to add the new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name : String ,
  items : [itemsSchema]  //embedding
};

const List = mongoose.model("List" , listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {

    if (foundItems.length == 0) { // If there are no items then add default items.
      Item.insertMany(defaultItems, function(err) {
        if (err) console.log(err);
        else {
          console.log("Successfully saved default items to items collection!");
        }
      });
      res.redirect(); // redirect to render in else part.
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});


app.get("/:customListName" , function(req ,res){      // For Custom list
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name : customListName} , function(err , foundList){
    if(err) console.log(err);
    else{
      if(!foundList)   // Can't use .length function coz its find one so no array here only one object
      {
         // Create a new list
           const list = new List({
           name : customListName ,
           items : defaultItems
         });
         list.save();
         res.redirect("/" + customListName);
      }
      else{
      // show existing list
      res.render("list" , {listTitle : foundList.name , newListItems : foundList.items});
      }
  }
  });

  // list.save();
});


app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name : itemName
  });

  if(listName === "Today"){
      newItem.save();  // shortcut to insert only one document
      res.redirect("/"); // To reach get route and show new item in the list.
  }
  else{
    List.findOne({name : listName} , function(err , foundList){
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete" , function(req , res){

  const itemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(itemId , function(err){
      if(!err){
        console.log("Deletion Successfull!");
        res.redirect("/");
      }
    });
  }
  else{
    // This method removes item from the array from a particular list of the List collection.
    List.findOneAndUpdate({name : listName} , {$pull : {items : {_id : itemId}}} , {} , function(err , foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }

});

app.get("/about", function(req, res) {
  res.render("about");
});




// For Heroku setup

let port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started Successfully !!");
});
