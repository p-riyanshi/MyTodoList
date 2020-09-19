//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();
const _ = require("lodash");
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB",
  {useNewUrlParser:true,useUnifiedTopology:true});

 mongoose.set('useFindAndModify', false);

const itemsSchema =new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "welcome to my to-do list"
})
const item2 = new Item({
  name: "hit the + button to add new item"
});
const item3 = new Item({
  name: "<----hit this to delete item"
});

const defaultItem = [item1,item2,item3];

const listsSchema =new mongoose.Schema({
  name: String,
  items: [itemsSchema]
})

const List = mongoose.model("List", listsSchema);

app.get("/", function(req, res) {

Item.find({},function(err,founditems){
  if(founditems.length===0){
    Item.insertMany(defaultItem,function(err){
  if(err){
    console.log(err);
  }
  else{
    console.log("success")
  }
  });
    res.redirect("/");
  }else{
    res.render("list", {listTitle: "Today", newListItems: founditems});
  }
});
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = _.capitalize(req.body.list);

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
      List.findOne({name:listName},function(err, foundList){
    if(!err){
        foundList.items.push(item);
        foundList.save();
        res.redirect("/"+listName)
    }
  })

  }

});

app.post("/delete", function(req,res){
  const id= req.body.checkbox
  const listHeading= _.capitalize(req.body.listHeading)

  if( listHeading === "Today"){
     Item.findByIdAndRemove({_id: id},function(err){
    if(!err){
      console.log("successfully deleted the task")
    }
  })
  res.redirect("/");
  }else{
    List.findOneAndUpdate({name: listHeading},{$pull:{items:{_id: id}}},function(err,foundList){
      if(!err){
        res.redirect("/"+listHeading)
      }
    })
  }
})

app.get("/:title",function(req,res){
    const customListName = _.capitalize(req.params.title);

    List.findOne({name:customListName},function(err, foundListName){
      if(!err){
        if(!foundListName){
          //adds a new list
          const list = new List({
            name: customListName,
            items: defaultItem
          })
          list.save();
          res.redirect("/"+ customListName)
        }
        else{
          //shows an existing list
          res.render("list", {listTitle: foundListName.name, newListItems: foundListName.items});
        }
      }
    })
})

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
