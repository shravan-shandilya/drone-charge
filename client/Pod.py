import logging,time,os,random,string,requests
from transitions import Machine
from transitions import logger
from web3 import Web3,RPCProvider,IPCProvider

base_url = "http://localhost:3000/api/"

class Pod(object):
	account = None
	web3_rpc = None
	web3 = None
	states= ["not_registered","not_connected","idle","verifying","idle_accepted","charging"]
	def __init__(self,p_id,name,rate,lat,lng):
		self.pod_id = p_id
		self.name = name
		self.rpm = rate
		self.lat = lat
		self.lng = lng
		self.mission = None
		if os.path.isfile("./.pod/secret"):
			temp = Pod.states[1]
		else:
			temp = Pod.states[0]
		self.machine = Machine(model=self,states=Pod.states,initial=temp,after_state_change="update_state_change_to_web")

		logger.setLevel(logging.INFO)
		self.machine.add_transition(trigger="register_success",source="not_registered",dest="idle")
		self.machine.add_transition(trigger="register_fail",source="not_registered",dest="not_registered")
		self.machine.add_transition(trigger="connect_fail",source="not_connected",dest="not_connected")
		self.machine.add_transition(trigger="connect_success",source="not_connected",dest="idle")
		self.machine.add_transition(trigger="recieved_offer",source="idle",dest="verifying")
		self.machine.add_transition(trigger="verification_succesful",source="verifying",dest="idle_accepted")
		self.machine.add_transition(trigger="verification_failure",source="verifying",dest="idle")
		self.machine.add_transition(trigger="recieved_approach_message",source="idle_connected",dest="charging")
		self.machine.add_transition(trigger="timeout",source="idle_accepted",dest="idle")
		self.machine.add_transition(trigger="charge_complete",source="charging",dest="idle")
		logger.info("Added transitions")

		self.machine.on_enter_idle("wait_for_offer")
		self.machine.on_enter_verifying("verify")
		self.machine.on_enter_charging("charge")
		logger.info("Added state callbacks to machine")
		
		Pod.web3_rpc = Web3(RPCProvider(host="localhost",port="8545"))
		Pod.web3 = Web3(IPCProvider(ipc_path="/home/miner/.ethereum/geth.ipc"))
		if self.web3:
			logger.info("created web3 endpoint")
		else:
			logger.error("Couldnot connect tp geth over RPC")
			logger.info("Make sure that geth is running")
			exit(-1)

	def register(self):
		#This will create an ethereum account for itself,push the publick key to web ui via register API call
		logger.info( "Registering")
		temp_password_file = file("./.pod/secret","w+")
		temp_password = ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits + string.ascii_lowercase) for _ in range(10))
		temp_password_file.write(temp_password)
		temp_password_file.close()
		temp_account_file = file("./.pod/account","w+")
		temp_account = Pod.web3.personal.newAccount(temp_password)
		if(temp_account):
			Pod.account = temp_account
			payload = { "type":"pod",
				    "namething":self.name,
				    "something":self.rpm,
				    "lat":self.lat,
				    "lng":self.lng
				  }
			responce = requests.post(base_url+"register",json=payload)
			print responce.json()
			if responce.json()["status"].encode('utf8') == "success":
				temp_account_file.write(temp_account)
				print "secret string:",responce.json()["id"].encode('utf8')
				logger.info("Registration success")
				temp_account_file.close()
				self.register_success()
			else:
				self.register_fail()
				logger.info("Registration failure")
		else:
			self.register_fail()
			logger.error("Registration failed")
	
	def connect(self):
		logger.info("connecting")
		temp_file = file("./.pod/secret","r")
		temp = temp_file.readline().rstrip()
		temp_file.close()
		temp_account_file = file("./.pod/account","r")
		Pod.account = temp_account_file.readline().rstrip()
		if(Pod.web3.personal.unlockAccount(Pod.account,temp)):
			self.connect_success()
			logger.info("connect succesful")
		else:
			self.connect_fail()
			logger.error("connect failed")

	
	def wait_for_offer(self):
		fil = Pod.web3.shh.filter({"topics":[Pod.web3.fromAscii("offer")]})
		print "Filter id:",fil.filter_id
		while True:
			temp = Pod.web3.shh.getFilterChanges(fil.filter_id)
			print "waiting for offer"
			if temp:
				print temp
				self.mission = Pod.web3.toAscii(temp[0]["payload"])
				print self.mission
				self.recieved_offer()
				break
			time.sleep(5)
	
	def verify(self):
		print "negotiating"
	
	def charge(self):
		print "charging"


	def update_state_change_to_web(self):
		print self.state		
		
