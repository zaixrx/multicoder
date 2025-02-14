export enum IconMode {
  Dark,
  Light,
}

function Icon({ name, mode = IconMode.Dark, ...rest }: any) {
  function getIconPath() {
    let path = "";

    switch (mode) {
      case IconMode.Dark:
        path = "/icons/dark/" + name;
        break;
      case IconMode.Light:
        path = "/icons/light/" + name;
        break;
    }

    return path;
  }

  return <img src={getIconPath()} {...rest} />;
}

export default Icon;
