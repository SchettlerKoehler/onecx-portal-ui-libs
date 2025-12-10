import { Meta, StoryObj } from '@storybook/angular'
import { ContentModule } from './content.module'
import { OcxContentComponent } from './content.component'

export default {
  title: 'Accelerator/Content',
  component: OcxContentComponent,
  decorators: [
    (storyFunc) => {
      return {
        moduleMetadata: { imports: [ContentModule] },
        template: storyFunc().template,
      }
    },
  ],
} as Meta<OcxContentComponent>

export const Basic: StoryObj<OcxContentComponent> = {
  render: (args: OcxContentComponent) => ({
    props: args,
    template: `<ocx-content title="Content">Sample content</ocx-content>`,
  }),
}
