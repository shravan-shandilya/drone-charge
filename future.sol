pragma solidity ^0.4.0;

contract future{
    address public drone;
    address public pod;
    uint8 rpm;
    uint start_time;
    uint stop_time;
    uint8 deposit;
    bool drone_agreed;
    bool pod_agreed;
    bool agreed;
    
    modifier onlyDrone{
        if(msg.sender != drone)
            throw;
        _;
    }
    
    modifier onlyPod{
        if(msg.sender != pod)
            throw;
        _;
    }
    
    function future(){
        drone = msg.sender;
    }
    
    function agreeFromDrone() returns(bool){
        drone_agreed = true;
        if(pod_agreed)
            agreed = true;
        return agreed;
    }
    
    function agreeFromPod() returns(bool){
        pod_agreed = true;
        if(drone_agreed)
            agreed = true;
        return agreed;
    }
    
    function setPod(address new_pod,uint8 new_rpm) onlyDrone returns (address){
        pod = new_pod;
        rpm = new_rpm;
        return pod;
    }
    
    function verify(uint8 expected_rpm)onlyPod returns (bool){
        return (expected_rpm == rpm);
    }
    
    function start() onlyDrone returns (uint){
        start_time = now;
        //Somehow indicate pod to start, maybe over shh
        return start_time;
    }
    
    function stop() onlyDrone returns (uint) {
        stop_time = now;
        //Somehow indicate pod to stop
        return stop_time;
    }
    
    function pay() returns (uint){
        //amount = (time_in_mins) * rpm;
        //return amount;
    } 
}
