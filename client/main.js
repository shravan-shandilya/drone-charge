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
			},
		});
	}
});

Template.login.events({
	"submit form":function(event,template){
		event.preventDefault();
		var emailVar = template.find("#login_email").value;
		var passVar = template.find("#login_password").value;
		console.log("Form submitted!");
		Meteor.loginWithPassword(emailVar,passVar);
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
		template.find("#addthing").style.display = "block"
	}
});

Template.addthing.events({
	"submit form":function(event,template){
		event.preventDefault();
		var namething = template.find("#name").value;
		var keything = template.find("#key").value;
		console.log("adding thing");
	}
});