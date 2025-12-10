import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ContentModule } from './content.module'
import { OcxContentComponent } from './content.component'

describe('OcxContentComponent (secondary entry)', () => {
  let fixture: ComponentFixture<OcxContentComponent>
  let component: OcxContentComponent

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentModule],
    }).compileComponents()

    fixture = TestBed.createComponent(OcxContentComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
