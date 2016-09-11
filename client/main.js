import { Drones } from "../api/cust_collection.js";
import { Pods } from "../api/cust_collection.js";

var table_dependents = new Deps.Dependency;

function getThings(user){
	if(user['profile']['type'] == "Drone"){
		return Drones;
	}
	else if(user['profile']['type'] == "Pod"){
		return Pods;
	}
}

Template.register.events({
	"submit form":function(event,template){
		event.preventDefault();
		var emailVar = template.find("#email").value;
		var passVar = template.find("#password").value;
		var typeVar = template.find("#type").value;
		var username = emailVar.substring(0,emailVar.indexOf('@'))
		console.log("Form submitted!");
		Accounts.createUser({
			email: emailVar,
			password: passVar,
			profile: {
				username: username,
				type: typeVar
			}
		},
		function(error){
			template.find("#alert").style.display = "block";
			template.find("#alert").className = "alert alert-danger";
			template.find("#alert").innerHTML = "Registration failed!";
			//console.log(error.reason);
		});
	}
});

Template.login.events({
	"submit form":function(event,template){
		event.preventDefault();
		var emailVar = template.find("#login_email").value;
		var passVar = template.find("#login_password").value;
		console.log("Form submitted!");
		Meteor.loginWithPassword(emailVar,passVar,function(error){
			template.find("#alert").style.display = "block";
			template.find("#alert").className = "alert alert-danger";
			template.find("#alert").innerHTML = "Snap..Login failed!";
			//console.log(error.reason);
		});
	}
});

Template.dashboard.events({
	"click .logout":function(event){
		event.preventDefault();
		Meteor.logout();
	},
	"click .add":function(event,template){
		event.preventDefault();
		console.log("adding");
	}
});

Template.addthing.events({
	"submit form":function(event,template){
		event.preventDefault();
		var namething = template.find("#name").value;
		var keything = template.find("#key").value;
		var user = Meteor.user();
		if(user['profile']['type'] == "Drone"){
			var Things = Drones;
		}
		else if(user['profile']['type'] == "Pod"){
			var Things = Pods;
		}
		//console.log("adding thing");
		//console.log(Things.find().fetch()[0]['user']);
		//console.log(Things.find(user._id).fetch()[0]);
		if(!Things.find(user._id).fetch()[0]){
			console.log("New user");
			Things.insert({
				_id: user._id,
				data:[{
					namething: namething,
					keything: keything
				},]
			});
		}else{
			console.log("New thing for the old user");
			Things.update(
				{"_id":user._id},
				{ "$addToSet":{ data:{
					namething:namething,
					keything:keything
				}
			}
		}
		);
			//console.log(Things.find(user._id).fetch()[0]);
		}
		//console.log(template);
		template.find("#alert").style.display = "block";
		//console.log(template.find("#alert"));
		table_dependents.changed();
	}
});

Template.table.helpers({
	vals: function(template){
		table_dependents.depend();
		var things = getThings(Meteor.user());
		//console.log(things.find(Meteor.userId()).fetch()[0]['data']);
		if(things.find(Meteor.userId()).fetch()[0]['data'].length === 0){
			//document.getElementById("alert_table");
		}
		//console.log(template.find("#alert_table"));
		var temp = {
			col_name1: "column1",
			col_name2: "column2",
			col_name3: "column3",
			data: things.find(Meteor.userId()).fetch()[0]['data'].length > 0 ? things.find(Meteor.userId()).fetch()[0]['data']:undefined
		}
		return temp;
	}
});