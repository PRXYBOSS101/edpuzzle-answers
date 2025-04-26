//Copyright (C) 2023 ading2210
//see README.md for more information

export var answerer_loaded = false;
export var content_loaded = false;

export class auto_answers {
  
static {
  answerer_loaded = true;
  answers_button.disabled = !content_loaded; 
}

static async answer_questions() {
  answers_button.value = "Submitting answers...";

  skipper_button.disabled = true;
  answers_button.disabled = true; 

  let attempt = await get_attempt();
  await video_skipper.skip_video(attempt, false);

  let filtered_questions = this.filter_questions(questions);
  await this.post_answers(attempt, filtered_questions, progress => {
    answers_button.value = `Submitting answers (${progress+1}/${filtered_questions.length})...`;
  });

  answers_button.value = "Answers submitted successfully.";
  opener.location.reload();
}

static filter_questions(questions) {
  let filtered_questions = [];
  
  for (let i=0; i<questions.length; i++) {
    let question = questions[i];
    if (question.type != "multiple-choice") continue;
    
    if (filtered_questions.length == 0) {
      filtered_questions.push([question]);
    }
    else if (filtered_questions[filtered_questions.length-1][0].time == question.time) {
      filtered_questions[filtered_questions.length-1].push(question);
    }
    else {
      filtered_questions.push([question]);
    }
  }

  return filtered_questions;
}

static async post_answers(attempt, filtered_questions, progress_callback=null) {
  let attempt_id = attempt._id;
  for (let i=0; i<filtered_questions.length; i++) {
    let question_part = filtered_questions[i];
    await this.post_answer(attempt_id, question_part);
    if (progress_callback) {
      progress_callback(i);
    }
  }
}

static async post_answer(attempt_id, questions_part) {
  let answers_url = "https://edpuzzle.com/api/v3/attempts/"+attempt_id+"/answers";

  let content = {answers: []};
  for (let i=0; i<questions_part.length; i++) {
    let question = questions_part[i];
    let correct_choices = [];
    for (let j=0; j<question.choices.length; j++) {
      let choice = question.choices[j];
      if (choice.isCorrect) {
        correct_choices.push(choice._id)
      }
    }
    content.answers.push({
      "questionId": question._id,
      "choices": correct_choices,
      "type": "multiple-choice"
    });
  }
  
  await fetch(answers_url, {
    method: "POST",
    headers: await construct_headers(),
    body: JSON.stringify(content)
  });
}

}