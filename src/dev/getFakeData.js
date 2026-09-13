import data from './hardcoded.json' with {type: 'json'}

export async function getPatients(){
  try{
    console.log('Fetched data:', data);
    return data.patients;
  }catch(error){
    console.error('Reading file:', error);
  }
}
