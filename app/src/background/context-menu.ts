import { OpenWithEntries } from "@/backend/api-model";
import { MenuItemConstructorOptions } from "electron";
import { menuItem } from "./menu-utils";

export function buildImageContextMenuTemplate(openWithEntries?: OpenWithEntries): MenuItemConstructorOptions[] {
  let openWithTemplate: MenuItemConstructorOptions[] = [];

  if (openWithEntries) {
    openWithTemplate = [
      menuItem({
        id: 'DefaultOpen',
        label: ' ' + openWithEntries.default.name,
        iconBase64: openWithEntries.default.icon,
      }),
      { type: 'separator' },
      ...
      openWithEntries.other.map(v => menuItem({
        id: 'OtherOpen',
        label: ' ' + v.name,
        iconBase64: v.icon,
      }))
    ];
  }

  return [
    menuItem({
      id: 'ShowMediaFile',
      label: 'Show Media File'
    }),
    {
      label: 'Open With',
      submenu: openWithTemplate,
    },
    { type: 'separator' },
    menuItem({
      id: 'ExportToFolder',
      label: 'Export To Folder...'
    }),
    { type: 'separator' },
    {
      label: 'Rating',
      submenu: [
        menuItem({
          id: 'Rating0',
          label: 'None',
          accelerator: 'Ctrl+0'
        }),
        { type: 'separator' },
        menuItem({
          id: 'Rating1',
          label: '★',
          accelerator: 'Ctrl+1'
        }),
        menuItem({
          id: 'Rating2',
          label: '★★',
          accelerator: 'Ctrl+2'
        }),
        menuItem({
          id: 'Rating3',
          label: '★★★',
          accelerator: 'Ctrl+3'
        }),
        menuItem({
          id: 'Rating4',
          label: '★★★★',
          accelerator: 'Ctrl+4'
        }),
        menuItem({
          id: 'Rating5',
          label: '★★★★★',
          accelerator: 'Ctrl+5'
        }),
      ],
    },
    {
      label: 'Label',
      submenu: [
        menuItem({
          id: 'LabelNone',
          label: 'None',
          accelerator: '0'
        }),
        { type: 'separator' },
        menuItem({
          id: 'LabelRed',
          label: 'Red',
          accelerator: '1'
        }),
        menuItem({
          id: 'LabelGreen',
          label: 'Green',
          accelerator: '2'
        }),
        menuItem({
          id: 'LabelBlue',
          label: 'Blue',
          accelerator: '3'
        }),
        menuItem({
          id: 'LabelBrown',
          label: 'Brown',
          accelerator: '4'
        }),
        menuItem({
          id: 'LabelMagenta',
          label: 'Magenta',
          accelerator: '5'
        }),
        menuItem({
          id: 'LabelOrange',
          label: 'Orange',
          accelerator: '6'
        }),
        menuItem({
          id: 'LabelYellow',
          label: 'Yellow',
          accelerator: '7'
        }),
        menuItem({
          id: 'LabelCyan',
          label: 'Cyan',
          accelerator: '8'
        }),
        menuItem({
          id: 'LabelGray',
          label: 'Gray',
          accelerator: '9'
        }),
      ]
    },
    { type: 'separator' },
    menuItem({
      id: 'RotateCW',
      label: 'Rotate 90° CW',
      accelerator: 'Command+]'
    }),
    menuItem({
      id: 'RotateCCW',
      label: 'Rotate 90° CCW',
      accelerator: 'Command+['
    }),
    // TODO: implement flipping support.
    // item('FlipVertical', 'Flip Vertical'),
    // item('FlipHorizontal', 'Flip Horizontal'),
    menuItem({
      id: 'DefaultOrientation',
      label: 'Default Orientation'
    }),
  ];
}