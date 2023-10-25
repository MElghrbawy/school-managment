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
    'schoolId': (data)=>{
        if(data.length <= 12){
            return false;
        }
        return true;
    },
    'classroomId': (data)=>{
        if (data.length <= 12) {
          return false;
        }
        return true;
    },

}
