import { MenuItemConstructorOptions, nativeImage } from "electron";
import { BrowserWindow } from 'electron';

declare interface MenuItemsParams {
  readonly id: string;
  readonly label: string;
  readonly accelerator?: string;
  readonly iconBase64?: string;
  readonly actionArgs?: readonly any[];
}

export function menuItem(params: MenuItemsParams): MenuItemConstructorOptions {
  let icon: nativeImage | undefined;
  if (params.iconBase64) {
    const dataURL = 'data:image/png;base64,' + params.iconBase64;
    const sourceIcon = nativeImage.createFromDataURL(dataURL);

    icon = sourceIcon.resize({ width: 16, height: 16 });
    icon.addRepresentation({
      scaleFactor: 2,
      dataURL: sourceIcon.resize({ width: 32, height: 32 }).toDataURL()
    });
    icon.addRepresentation({
      scaleFactor: 4,
      dataURL: sourceIcon.resize({ width: 64, height: 64 }).toDataURL()
    });
  }

  return {
    id: params.id,
    label: params.label,
    icon,
    accelerator: params.accelerator,
    click: function () {
      const win = BrowserWindow.getFocusedWindow();
      win?.webContents.send('action', params.id, ...params.actionArgs ?? []);
    }
  }
}