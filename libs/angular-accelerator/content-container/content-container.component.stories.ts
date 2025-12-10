import { Meta, StoryObj } from '@storybook/angular'
import { ContentContainerModule } from './content-container.module'
import { OcxContentContainerComponent } from './content-container.component'

export default {
  title: 'Accelerator/Content Container',
  component: OcxContentContainerComponent,
  decorators: [
    (storyFunc) => {
      return {
        moduleMetadata: { imports: [ContentContainerModule] },
        template: storyFunc().template,
      }
    },
  ],
} as Meta<OcxContentContainerComponent>

export const Basic: StoryObj<OcxContentContainerComponent> = {
  render: (args: OcxContentContainerComponent) => ({
    props: args,
    template: `<ocx-content-container>Container content</ocx-content-container>`,
  }),
}
