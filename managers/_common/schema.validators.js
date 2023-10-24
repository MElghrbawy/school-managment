// prettier-ignore
module.exports = {
    'username': (data)=>{
        if(data.trim().length < 3){
            return false;
        }
        return true;
    },
    'email': (data)=>{
        if(!data.includes('@')){
            return false;
        }
        return true;
    },
}
