import React from 'react';
import './App.css';

const absExercise = {
  name: "Legs up machine", weight: 10, reps: 10, sets: 3,
  img: 'https://www.verywellfit.com/thmb/MKsWT4vfj2mrWokgfUH6wF6YkfI=/768x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/42-3498291-Captains-Chair-Leg-Raises-GIF-a2f30dc759fe474c94893c8bd19abecb.gif'
}
const aPlan = {
  abs: [absExercise],
  cheast: [
      { name: "benchpress", weight: 50, img:'https://www.verywellfit.com/thmb/rFLCeHZBQ1mB5x1JQgndRMYIfVs=/768x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/29-3498606-Bench-Press-GIF-b26faabc528b48a8b3a145797ddfa0e3.gif' },
      { name: "incline fly dumbbell press", weight: 30, img:'https://3.bp.blogspot.com/-wbUrXKGMGII/W1Vmz8pTaAI/AAAAAAAAS3I/e6ppqmGlqmkYgcrTmsv8CQUrO3fTrtcyACLcBGAs/s1600/flat%2Bdumbbell%2Bfly.gif' },
      { name: "Incline Dumbbell Press", weight: 30, img:'https://www.verywellfit.com/thmb/qNXStexc84q69N8Nzie2q0a1cuA=/768x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/66-4588212-Incline-Dumbbell-Press-GIF-cc6b35c8cecc4b808532c881732bf3f0.gif' }
  ],
  "back arm": [
      { name: "tricep dip machine", img:'https://hips.hearstapps.com/ame-prod-menshealth-assets.s3.amazonaws.com/main/assets/dips.gif?resize=480:*' },
      { name: "arm spread free", weight: 10, img: 'https://qph.fs.quoracdn.net/main-qimg-44e1d4df06f29fd67693a331b384615d' }
  ],
  sholders: [
      { name: "barbell push press", weight: 20, img: 'https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwigksOyuL3mAhUQqxoKHdDBCjoQjRx6BAgBEAQ&url=https%3A%2F%2Fwww.pinterest.com%2Fpin%2F353251164507068514%2F&psig=AOvVaw2UvJnoXYggDhReK2AJ69Y8&ust=1576698096019888' },
      { name: "dumble straight", weight: 10, img: 'https://hips.hearstapps.com/hmg-prod.s3.amazonaws.com/images/workouts/2016/03/frontraise-1456955633.gif' },
      { name: "dumbble side", weight: 10, img: 'https://i2.wp.com/kandeleria.ru/wp-content/uploads/2014/02/kak-nakachat-plechi-v-domashnih-usloviyah-04.gif' }
  ]
};
const bPlan = {
  abs: [absExercise],
    legs: [
        { name: "squat", weight: 50, img: 'https://static.wixstatic.com/media/0848b2_1479551dfbd3461691ff5f185dd6c49c~mv2.gif' }, 
        { name: "tip toe", img: 'https://qph.fs.quoracdn.net/main-qimg-6617da09b5d4d0e3d7a1cfa4a89a0134' }
    ],
  back: [
      { name: "dead lift", weight: 100, img:'https://hips.hearstapps.com/ame-prod-menshealth-assets.s3.amazonaws.com/main/assets/stiff-leg-deadlift.gif?crop=0.670xw:1.00xh;0.157xw,0&resize=320:*' },
      { name: "pull up", weight: 10, img:'https://hips.hearstapps.com/hmg-prod.s3.amazonaws.com/images/workouts/2016/03/pullup-1456956490.gif?crop=1xw:1xh;center,top&resize=480:*' },
      { name: "bench pull up over head", weight: 30, img:'https://fitnessmajlis.com/Data/Exercise/Images/168_4dumbbell_pullovers.gif' }
  ],
  "front hand": [
      { name: "standing push bar", weight: 20, img: 'https://qph.fs.quoracdn.net/main-qimg-96d11073c2b93ef358e0315c439594f3' },
      { name: "dumbble hammer curl", weight: 10, img:'https://fitnessandbeast.com/wp-content/uploads/2018/10/Alternatin-Dumbbell-Curl.gif' },
      { name: "preacher dumbble curl", weight: 10, img:'https://www.indianbodybuilding.co.in/wp-content/uploads/2014/11/Biceps-Workout-Preachers-Curls-Movement.gif' }
  ]
};
const plans = [{ name: "A", plan: aPlan }, { name: "B", plan: bPlan }];

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomExercise(plans) {
    const plan = plans[getRandomInt(0, plans.length-1)].plan
    const groups = Object.keys(plan)
    const group = groups[getRandomInt(0, groups.length-1)]
    return plan[group][getRandomInt(0, plan[group].length-1)]
}

function App() {
    const ex = getRandomExercise(plans)
    console.log(ex)
  return (
    <div className="App">
      <header className="App-header">
            <div>
              <div className="hsplit">
                <div className="vsplit full">
                    <h1>{ex.name}</h1>
                    <div className="vsplit full">
                        <div className="vsplit full">
                          <div className="hsplit full">
                              <h2 className="full">
                                  {ex.sets}
                              </h2>
                              <h2 className="full">
                                  {ex.reps}
                              </h2>
                          </div>
                          <h1 className="full">
                              {ex.weight}Kg
                          </h1>
                        </div>
                    </div>
                </div>
                <img className="full maxImg" alt={ex.name} src={ex.img}/>
              </div>
            </div>

            <div>
              {plans.map((plan, index) => (
                <Plan key={index} {...plan} />
              ))}
            </div>
      </header>
    </div>
  );
}

function Plan({ name, plan }) {
  return (
    <table>
      <thead>
        <tr>
          <th colSpan={5}>{name}</th>
        </tr>
        <tr>
          <th rowSpan={2}>Group</th>
          <th rowSpan={2}>Exercise</th>
          <th colSpan={3}>Power</th>
        </tr>
        <tr>
          <th>Reps</th>
          <th>Sets</th>
          <th>Weight</th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(plan).map((group, index) => (
          <Group key={group} exercises={plan[group]} group={group} even={index % 2 === 1} />
        ))}
      </tbody>
    </table>
  );
}

function Group({ group, exercises, even = false }) {
  return (
    <>
      {exercises.map((exercise, index) => (
        <Exercise
            key={exercise.name}
          {...exercise}
          group={group}
          exercisesInGroup={index === 0 ? exercises.length : undefined}
          even={even}
        />
      ))}
    </>
  );
}

function Exercise({
  group,
  exercisesInGroup,
  name,
  weight = 0,
  even = false,
  reps = 1,
  sets = 1
}) {
  return (
    <tr className={even ? "evenGroup" : "oddGroup"}>
      {exercisesInGroup && <td rowSpan={exercisesInGroup}>{group}</td>}

      <td>{name}</td>
      <td>{`${reps}`}</td>
      <td>{`${sets}`}</td>
      <td>{`${weight}`}Kg</td>
    </tr>
  );
}

export default App;
