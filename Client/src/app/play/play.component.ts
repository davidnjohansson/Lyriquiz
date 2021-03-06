import { Component, OnInit } from '@angular/core';
import { Question, RelatedArtist } from 'src/models/question.model';
import { QuestionService } from 'src/services/question.service';
import { TeamService } from 'src/services/team.service';
import { Team } from 'src/models/team.model';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { AnswerComponent } from '../answer/answer.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-play',
  templateUrl: './play.component.html',
  styleUrls: ['./play.component.css']
})
export class PlayComponent implements OnInit {
  question: Question;
  artists: RelatedArtist[];
  speechSynthesis: any = window.speechSynthesis;
  teams: Team[];

  constructor(private questionService: QuestionService, private teamService: TeamService, private answerDialog: MatDialog, private router: Router) {
    this.teams = [];
  }

  ngOnInit() {
    this.teamService.getTeams().subscribe(teams => {
      this.teams = teams;
    });

    this.getQuestion();
  }

  // Clears question object and fetches new question from Question Service
  getQuestion() {
    this.question = null;
    this.questionService.getQuestion().subscribe((response: Question) => {
      this.question = response;
      this.questionService.setQuestion(this.question);
      console.log(this.question);
    }, error => console.log(error),
      () => this.generateQuestion());
  }

  generateQuestion() {
    let array: RelatedArtist[] = [];

    // Add the "correct" artist
    let artist = new RelatedArtist();
    artist.Artist = this.question.Answer.Artist;
    artist.Photo = this.question.Answer.Photo;
    array.push(artist);

    // Add the "related" artists
    for (var i = 0; i < 3; i++) {
      let artist = new RelatedArtist();
      artist.Artist = this.question.RelatedArtists[i].Artist;
      artist.Photo = this.question.RelatedArtists[i].Photo;
      array.push(artist);
    }

    // Shuffle the artists
    this.artists = this.shuffleArtists(array);
    this.speak(this.question.Answer.Song.SongLyrics);
  }

  shuffleArtists(array: RelatedArtist[]) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }

  // Gives a lyric to the Speech synthesizer which speaks it
  speak(lyrics: string) {
    let sayThis = new SpeechSynthesisUtterance(lyrics);
    sayThis.lang = "en-US";
    sayThis.rate = 0.7;
    this.speechSynthesis.speak(sayThis);
  }

  // Cancels the speech, sets the corect answer, prompts the user with a dialog where he/she can answer
  // If game is over it routes to the Game Over component, else it fetches a new question
  onAnswer(answer: string) {
    this.speechSynthesis.cancel();
    let correctAnswer: boolean;
    if (answer == this.question.Answer.Artist) {
      correctAnswer = true;
    } else {
      correctAnswer = false;
    }

    let question = this.question;
    let trackId = this.question.Answer.Song.SongId;

    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    dialogConfig.disableClose = true;
    dialogConfig.width = "30%";
    dialogConfig.data = { question, correctAnswer, trackId };

    let dialogRef = this.answerDialog.open(AnswerComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(x => {
      if (this.isGameOver()) {
        this.questionService.setQuestion(null);
        this.router.navigate(['game-over']);
      } else {
        this.questionService.setQuestion(null);
        this.getQuestion();
      }
    });
  }

  // Determines if any team has a score of 5, if yes return true, else return false
  private isGameOver(): boolean {
    for (var i = 0; i < this.teams.length; i++) {
      if (this.teams[i].score == 5) {
        return true;
      }
    }
    return false;
  }

  // An option for the players to skip the current question if no one wants to answer
  onSkip() {
    this.speechSynthesis.cancel();
    this.questionService.setQuestion(null);
    this.getQuestion();
  }
}